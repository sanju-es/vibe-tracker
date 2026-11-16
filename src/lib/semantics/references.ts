import type {
  Cell,
  CellReference,
  Document,
  InlineRun,
  ItemTarget,
  RefTarget,
  RowTarget,
  Table,
} from "../model/types";
import { runsText } from "../model/text";
import { normalizeText } from "../format/text";

/** Identifiers indexed for references: `D-04`, `FR-3`, `CORE-08`, `V-2`. */
export const IDENTIFIER_PATTERN = /^[A-Z]{1,5}-[0-9]{1,3}$/;

/** Same identifier inside running text; boundaries avoid matching longer tokens. */
const IDENTIFIER_IN_TEXT = /(?<![A-Za-z0-9-])([A-Z]{1,5}-[0-9]{1,3})(?![0-9A-Za-z-])/g;

/** Identifier that starts a definition item, e.g. `**FR-3 — …**`. */
const LEADING_IDENTIFIER = /^([A-Z]{1,5}-[0-9]{1,3})(?=$|[\s—–:-])/;

export function isIdentifier(value: string): boolean {
  return IDENTIFIER_PATTERN.test(value.trim());
}

/** Resolves a relative path against the document that contains the link. */
export function resolveRelative(fromPath: string, target: string): string {
  const clean = target.split("#")[0]?.split("?")[0] ?? "";
  if (clean.startsWith("/")) return clean.slice(1);
  const base = fromPath.split("/");
  base.pop();
  for (const segment of clean.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") base.pop();
    else base.push(segment);
  }
  return base.join("/");
}

function push(
  index: Map<string, RefTarget[]>,
  identifier: string,
  target: RefTarget,
): void {
  const bucket = index.get(identifier);
  if (bucket) bucket.push(target);
  else index.set(identifier, [target]);
}

/**
 * Identifier → items that define it. It indexes table rows (first column), list
 * items and headings whose text starts with an identifier. Duplicates are kept.
 */
export function buildIndex(documents: readonly Document[]): Map<string, RefTarget[]> {
  const index = new Map<string, RefTarget[]>();

  for (const document of documents) {
    for (const table of document.tables) {
      for (const row of table.rows) {
        const identifier = row.cells[0]?.text.trim() ?? "";
        if (!isIdentifier(identifier)) continue;
        const target: RowTarget = {
          kind: "row",
          documentId: document.id,
          documentTitle: document.title,
          moduleNumber: document.moduleNumber,
          tableId: table.id,
          rowId: row.id,
          headers: table.headers,
          cells: row.cells,
        };
        push(index, identifier, target);
      }
    }

    let sectionTitle: string | null = null;
    let sectionAnchor: string | null = null;
    for (const node of document.nodes) {
      if (node.type === "heading") {
        const headingText = runsText(node.runs);
        const identifier = LEADING_IDENTIFIER.exec(headingText.trim())?.[1] ?? "";
        if (identifier !== "" && isIdentifier(identifier)) {
          const target: ItemTarget = {
            kind: "item",
            documentId: document.id,
            documentTitle: document.title,
            moduleNumber: document.moduleNumber,
            sectionTitle: headingText,
            anchor: node.anchor,
            text: headingText.trim(),
          };
          push(index, identifier, target);
        }
        sectionTitle = headingText;
        sectionAnchor = node.anchor;
        continue;
      }
      if (node.type !== "list") continue;

      for (const item of node.items) {
        const text = runsText(item).trim();
        const match = LEADING_IDENTIFIER.exec(text);
        if (!match) continue;
        const identifier = match[1] ?? "";
        if (!isIdentifier(identifier)) continue;
        const target: ItemTarget = {
          kind: "item",
          documentId: document.id,
          documentTitle: document.title,
          moduleNumber: document.moduleNumber,
          sectionTitle,
          anchor: sectionAnchor,
          text,
        };
        push(index, identifier, target);
      }
    }
  }

  return index;
}

export function duplicateIdentifiers(index: Map<string, RefTarget[]>): string[] {
  return [...index.entries()]
    .filter(([, targets]) => targets.length > 1)
    .map(([id]) => id);
}

const GLOBAL_NAMESPACE = /^(D|CORE|CR|SEC|DOC|REL|RISK)-/;

/**
 * One reference should point at one defining item. Global identifiers prefer the
 * project definition over module glosses; within a scope, a list item definition
 * wins over a secondary table row (acceptance, indexes).
 */
function canonicalTargets(targets: RefTarget[], global: boolean): RefTarget[] {
  let pool = targets;
  if (global) {
    const project = targets.filter((target) => target.moduleNumber === null);
    if (project.length > 0) pool = project;
  }
  const items = pool.filter((target) => target.kind === "item");
  return items.length > 0 ? items : pool;
}

/**
 * Targets visible from a document. Global namespaces resolve anywhere; a module
 * identifier resolves in its own module first and then at project level; a
 * project document only sees project-level definitions. An explicit `NN` prefix
 * narrows the search to that module.
 */
export function resolveTargets(
  identifier: string,
  fromModule: number | null,
  index: Map<string, RefTarget[]>,
  qualifier: number | null = null,
): RefTarget[] {
  const all = index.get(identifier) ?? [];
  const global = GLOBAL_NAMESPACE.test(identifier);
  if (global) return canonicalTargets(all, true);
  if (qualifier !== null) {
    return canonicalTargets(
      all.filter((target) => target.moduleNumber === qualifier),
      false,
    );
  }
  if (fromModule !== null) {
    const local = all.filter((target) => target.moduleNumber === fromModule);
    if (local.length > 0) return canonicalTargets(local, false);
  }
  return canonicalTargets(
    all.filter((target) => target.moduleNumber === null),
    false,
  );
}

function cloneCell(cell: Cell): Cell {
  return { ...cell, runs: cell.runs, ref: cell.ref };
}

function cloneTable(table: Table): Table {
  return {
    ...table,
    rows: table.rows.map((row) => ({ ...row, cells: row.cells.map(cloneCell) })),
  };
}

/**
 * Annotates table cells whose text matches an indexed identifier exactly, except
 * the identifier cell of the row itself.
 */
export function attachReferences(
  documents: readonly Document[],
  index: Map<string, RefTarget[]>,
): Document[] {
  return documents
    .map((document) => ({
      ...document,
      tables: document.tables.map(cloneTable),
    }))
    .map((document) => {
      for (const table of document.tables) {
        for (const row of table.rows) {
          for (const cell of row.cells) {
            const identifier = cell.text.trim();
            if (!isIdentifier(identifier)) continue;
            const targets = resolveTargets(identifier, document.moduleNumber, index);
            if (targets.length === 0) continue;
            if (cell.column === 0) continue;
            const foreign = targets.filter(
              (target) =>
                !(
                  target.kind === "row" &&
                  target.documentId === document.id &&
                  target.rowId === row.id
                ),
            );
            if (foreign.length === 0) continue;
            const reference: CellReference = { identifier, targets: foreign };
            cell.ref = reference;
          }
        }
      }
      return document;
    });
}

interface SplitResult {
  runs: InlineRun[];
  length: number;
}

type Resolve = (identifier: string, qualifier: number | null) => RefTarget[];

const QUALIFIER_BEFORE = /(?:^|\s)(\d{2})\s+$/;

function splitRuns(
  runs: readonly InlineRun[],
  baseOffset: number,
  skipOffset: number | null,
  resolve: Resolve,
): SplitResult {
  const output: InlineRun[] = [];
  let consumed = 0;

  for (const run of runs) {
    if (run.kind === "text") {
      let cursor = 0;
      let changed = false;
      IDENTIFIER_IN_TEXT.lastIndex = 0;
      let match: RegExpExecArray | null = IDENTIFIER_IN_TEXT.exec(run.text);
      while (match) {
        const identifier = match[1] ?? "";
        const absolute = baseOffset + consumed + match.index;
        const qualifierMatch = QUALIFIER_BEFORE.exec(run.text.slice(0, match.index));
        const qualifierText = qualifierMatch?.[1];
        const qualifier = qualifierText ? Number.parseInt(qualifierText, 10) : null;
        const targets = resolve(identifier, qualifier);
        const isDefinition = skipOffset !== null && absolute === skipOffset;
        if (targets.length === 0 || isDefinition) {
          match = IDENTIFIER_IN_TEXT.exec(run.text);
          continue;
        }
        const qualifierRaw = qualifierText
          ? (qualifierMatch?.[0] ?? "").replace(/^[^\d]*/, "")
          : "";
        const start = match.index - qualifierRaw.length;
        if (start > cursor) {
          output.push({ kind: "text", text: run.text.slice(cursor, start) });
        }
        output.push({
          kind: "reference",
          text: qualifierText ? `${qualifierText} ${identifier}` : identifier,
          ref: { identifier, targets },
        });
        cursor = match.index + identifier.length;
        changed = true;
        match = IDENTIFIER_IN_TEXT.exec(run.text);
      }
      if (!changed) {
        output.push(run);
      } else if (cursor < run.text.length) {
        output.push({ kind: "text", text: run.text.slice(cursor) });
      }
      consumed += run.text.length;
      continue;
    }

    if (run.kind === "code") {
      const text = run.text;
      const absoluteStart = baseOffset + consumed;
      const pattern =
        /(?<![A-Za-z0-9-])(?:(\d{2})\s+)?([A-Z]{1,5}-[0-9]{1,3})(?![0-9A-Za-z-])/g;
      let cursor = 0;
      let changed = false;
      let match: RegExpExecArray | null = pattern.exec(text);
      while (match) {
        const identifier = match[2] ?? "";
        const qualifier = match[1] ? Number.parseInt(match[1], 10) : null;
        const targets = resolve(identifier, qualifier);
        const isDefinition =
          skipOffset !== null && absoluteStart + match.index === skipOffset;
        if (targets.length === 0 || isDefinition) {
          match = pattern.exec(text);
          continue;
        }
        if (match.index > cursor) {
          output.push({ kind: "code", text: text.slice(cursor, match.index) });
        }
        output.push({
          kind: "reference",
          text: qualifier !== null ? `${match[1]} ${identifier}` : identifier,
          ref: { identifier, targets },
        });
        cursor = match.index + match[0].length;
        changed = true;
        match = pattern.exec(text);
      }
      if (!changed) {
        output.push(run);
      } else if (cursor < text.length) {
        output.push({ kind: "code", text: text.slice(cursor) });
      }
      consumed += text.length;
      continue;
    }

    if (run.children && run.children.length > 0) {
      const child = splitRuns(run.children, baseOffset + consumed, skipOffset, resolve);
      output.push({ ...run, children: child.runs });
      consumed += child.length;
      continue;
    }

    output.push(run);
    consumed += run.text.length;
  }

  return { runs: output, length: consumed };
}

/**
 * Turns every visible identifier inside running text into a reference run. The
 * identifier that defines a heading, a list item or a first-cell row is not
 * linked to itself. Table cells get the same treatment, so several identifiers
 * in one cell are independent references.
 */
export function attachInlineReferences(
  documents: readonly Document[],
  index: Map<string, RefTarget[]>,
): Document[] {
  return documents.map((document) => {
    const resolve: Resolve = (identifier, qualifier) =>
      resolveTargets(identifier, document.moduleNumber, index, qualifier);

    return {
      ...document,
      meta: {
        ...document.meta,
        fields: document.meta.fields.map((field) => ({
          ...field,
          runs: splitRuns(field.runs, 0, null, resolve).runs,
        })),
      },
      tables: document.tables.map((table) => ({
        ...table,
        rows: table.rows.map((row) => ({
          ...row,
          cells: row.cells.map((cell) => ({
            ...cell,
            runs: splitRuns(cell.runs, 0, cell.column === 0 ? 0 : null, resolve).runs,
          })),
        })),
      })),
      nodes: document.nodes.map((node) => {
        switch (node.type) {
          case "heading": {
            const leading = LEADING_IDENTIFIER.exec(runsText(node.runs).trim());
            const identifier = leading?.[1] ?? null;
            const visible = identifier !== null && resolve(identifier, null).length > 0;
            return {
              ...node,
              runs: splitRuns(node.runs, 0, visible ? 0 : null, resolve).runs,
            };
          }
          case "paragraph":
            return { ...node, runs: splitRuns(node.runs, 0, null, resolve).runs };
          case "quote":
            return { ...node, runs: splitRuns(node.runs, 0, null, resolve).runs };
          case "list": {
            const items = node.items.map((item) => {
              const leading = LEADING_IDENTIFIER.exec(runsText(item).trim());
              const identifier = leading?.[1] ?? null;
              const visible = identifier !== null && resolve(identifier, null).length > 0;
              const skipOffset = visible ? 0 : null;
              return splitRuns(item, 0, skipOffset, resolve).runs;
            });
            return { ...node, items };
          }
          default:
            return node;
        }
      }),
    };
  });
}

export function normalizeIdentifier(value: string): string {
  return normalizeText(value);
}
