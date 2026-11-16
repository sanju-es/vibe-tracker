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

/**
 * Identifier shapes registered by `docs/DOC-STANDARD.md` §6.1. Rule prefixes
 * (`G`, `T`, `V`, `R`, `F`, `L`, `AG`, `E`), retired prefixes and reserved
 * namespaces without an artifact are not project references and stay plain text.
 */
const GLOBAL_PREFIXES = new Set(["D", "CORE", "CR"]);
const MODULE_PREFIXES = new Set(["FR", "BR", "VAL", "MS", "B"]);
const FIXED_TWO_DIGITS = new Set(["D", "CORE", "CR", "MS", "B"]);

const IDENTIFIER_SHAPE = /^([A-Z]{1,5})-([0-9]{1,3})$/;

/** Same identifier inside running text, with an optional `NN ` qualifier. */
const IDENTIFIER_IN_TEXT =
  /(?<![A-Za-z0-9-])(?:(\d{1,3})\s+)?([A-Z]{1,5}-[0-9]{1,3})(?![0-9A-Za-z-])/g;

/** Identifier that starts a definition item, e.g. `FR-3 — …`. */
const LEADING_IDENTIFIER = /^([A-Z]{1,5}-[0-9]{1,3})(?=$|[\s—–:-])/;

/** Exact cell content: a bare identifier or a `NN ` qualified one. */
const EXACT_IDENTIFIER = /^(?:(\d{1,3})\s+)?([A-Z]{1,5}-[0-9]{1,3})$/;

/** Numbered slot heading text, e.g. `2. Functional requirements`. */
const SECTION_NUMBER = /^(\d+)\.?\s/;

export interface ParsedIdentifier {
  /** Canonical text, exactly as written. */
  value: string;
  prefix: string;
  number: string;
  scope: "global" | "module";
}

export function parseIdentifier(value: string): ParsedIdentifier | null {
  const match = IDENTIFIER_SHAPE.exec(value.trim());
  if (!match) return null;
  const prefix = match[1] ?? "";
  const number = match[2] ?? "";
  const global = GLOBAL_PREFIXES.has(prefix);
  if (!global && !MODULE_PREFIXES.has(prefix)) return null;
  if (FIXED_TWO_DIGITS.has(prefix) && number.length !== 2) return null;
  return {
    value: `${prefix}-${number}`,
    prefix,
    number,
    scope: global ? "global" : "module",
  };
}

export function isIdentifier(value: string): boolean {
  return parseIdentifier(value) !== null;
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

interface DefinitionRule {
  slot: number;
  shape: "row" | "heading" | "list";
  prefix: string;
}

/**
 * The owning file and section of every namespace (§6.1). Only these definitions
 * enter the index: a decision index, an acceptance row or a changelog bullet is
 * a mention, not a definition.
 */
function definitionRules(document: Document): DefinitionRule[] {
  const name = document.fileName;
  if (document.moduleNumber === null) {
    return name === "DECISIONS.md" ? [{ slot: 1, shape: "row", prefix: "D" }] : [];
  }
  const rules: DefinitionRule[] = [];
  if (name === "REQUIREMENTS.md") {
    rules.push({ slot: 2, shape: "heading", prefix: "FR" });
    rules.push({ slot: 3, shape: "list", prefix: "BR" });
    rules.push({ slot: 5, shape: "list", prefix: "VAL" });
  }
  if (name === "TECHNICAL.md") {
    rules.push({ slot: 8, shape: "row", prefix: "MS" });
  }
  if (name === "BACKLOG.md") {
    rules.push({
      slot: 1,
      shape: "row",
      prefix: document.moduleNumber === 0 ? "CORE" : "B",
    });
  }
  if (name === "MODULE.md" && document.moduleNumber === 0) {
    rules.push({ slot: 4, shape: "row", prefix: "CR" });
  }
  return rules;
}

function slotOf(heading: string): number | null {
  const match = SECTION_NUMBER.exec(heading.trim());
  if (!match) return null;
  const slot = Number.parseInt(match[1] ?? "", 10);
  return Number.isFinite(slot) ? slot : null;
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
 * Identifier → items that define it, built only from the owning file and slot.
 * Duplicates are kept so the reader can list them.
 */
export function buildIndex(documents: readonly Document[]): Map<string, RefTarget[]> {
  const index = new Map<string, RefTarget[]>();

  for (const document of documents) {
    const rules = definitionRules(document);
    if (rules.length === 0) continue;

    let currentSlot: number | null = null;
    let sectionTitle: string | null = null;
    let sectionAnchor: string | null = null;

    for (const node of document.nodes) {
      if (node.type === "heading") {
        const headingText = runsText(node.runs).trim();
        if (node.level <= 2) {
          currentSlot = node.level === 2 ? slotOf(headingText) : null;
        }
        sectionTitle = headingText;
        sectionAnchor = node.anchor;

        const rule = rules.find(
          (candidate) => candidate.slot === currentSlot && candidate.shape === "heading",
        );
        if (!rule || node.level !== 3) continue;
        const leading = LEADING_IDENTIFIER.exec(headingText);
        const parsed = leading ? parseIdentifier(leading[1] ?? "") : null;
        if (!parsed || parsed.prefix !== rule.prefix) continue;
        const target: ItemTarget = {
          kind: "item",
          documentId: document.id,
          documentTitle: document.title,
          moduleNumber: document.moduleNumber,
          sectionTitle: headingText,
          anchor: node.anchor,
          text: headingText,
        };
        push(index, parsed.value, target);
        continue;
      }

      if (node.type === "list") {
        const rule = rules.find(
          (candidate) => candidate.slot === currentSlot && candidate.shape === "list",
        );
        if (!rule) continue;
        for (const item of node.items) {
          const text = runsText(item).trim();
          const leading = LEADING_IDENTIFIER.exec(text);
          const parsed = leading ? parseIdentifier(leading[1] ?? "") : null;
          if (!parsed || parsed.prefix !== rule.prefix) continue;
          const target: ItemTarget = {
            kind: "item",
            documentId: document.id,
            documentTitle: document.title,
            moduleNumber: document.moduleNumber,
            sectionTitle,
            anchor: sectionAnchor,
            text,
          };
          push(index, parsed.value, target);
        }
        continue;
      }

      if (node.type === "table") {
        const rule = rules.find(
          (candidate) => candidate.slot === currentSlot && candidate.shape === "row",
        );
        if (!rule) continue;
        const table = document.tables.find((candidate) => candidate.id === node.tableId);
        if (!table) continue;
        for (const row of table.rows) {
          const identifier = row.cells[0]?.text.trim() ?? "";
          const parsed = parseIdentifier(identifier);
          if (!parsed || parsed.prefix !== rule.prefix) continue;
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
          push(index, parsed.value, target);
        }
      }
    }
  }

  return index;
}

/**
 * Duplicates are per namespace: a global id is repeated repository-wide, while
 * a module id is repeated only inside one module (R-01, R-02, R-04).
 */
export function duplicateIdentifiers(index: Map<string, RefTarget[]>): string[] {
  const duplicates: string[] = [];
  for (const [identifier, targets] of index.entries()) {
    if (targets.length < 2) continue;
    const parsed = parseIdentifier(identifier);
    if (!parsed) continue;
    if (parsed.scope === "global") {
      duplicates.push(identifier);
      continue;
    }
    const counts = new Map<number | null, number>();
    for (const target of targets) {
      counts.set(target.moduleNumber, (counts.get(target.moduleNumber) ?? 0) + 1);
    }
    for (const [moduleNumber, count] of counts) {
      if (count < 2) continue;
      duplicates.push(
        moduleNumber === null
          ? identifier
          : `${String(moduleNumber).padStart(2, "0")} ${identifier}`,
      );
    }
  }
  return duplicates.sort();
}

/**
 * Targets visible from a document (§6.1, R-01 to R-03):
 * - `D`, `CORE` and `CR` resolve from anywhere and are never qualified.
 * - A module identifier resolves inside the module that defines it; outside
 *   that module the `NN ID` qualifier is required.
 * - A module identifier without a qualifier in a project document does not
 *   resolve.
 */
export function resolveTargets(
  identifier: string,
  fromModule: number | null,
  index: Map<string, RefTarget[]>,
  qualifier: number | null = null,
): RefTarget[] {
  const parsed = parseIdentifier(identifier);
  if (!parsed) return [];
  const all = index.get(parsed.value) ?? [];
  if (all.length === 0) return [];
  if (parsed.scope === "global") return all;
  if (qualifier !== null) {
    return all.filter((target) => target.moduleNumber === qualifier);
  }
  if (fromModule === null) return [];
  return all.filter((target) => target.moduleNumber === fromModule);
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

/** Parses a cell that holds nothing but a bare or `NN ` qualified identifier. */
function parseExact(
  text: string,
): { parsed: ParsedIdentifier; qualifier: number | null } | null {
  const match = EXACT_IDENTIFIER.exec(text.trim());
  if (!match) return null;
  const parsed = parseIdentifier(match[2] ?? "");
  if (!parsed) return null;
  const qualifierText = match[1];
  if (qualifierText !== undefined) {
    if (parsed.scope === "global" || qualifierText.length !== 2) return null;
  }
  return {
    parsed,
    qualifier: qualifierText === undefined ? null : Number.parseInt(qualifierText, 10),
  };
}

function withoutSelf(
  targets: RefTarget[],
  document: Document,
  rowId: string | null,
): RefTarget[] {
  return targets.filter(
    (target) =>
      !(
        target.kind === "row" &&
        target.documentId === document.id &&
        target.rowId === rowId
      ),
  );
}

/**
 * Annotates table cells whose text is exactly an identifier. The defining cell
 * of a row is not linked to itself; every other cell, including the first
 * column of a non-owner table, is.
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
            const exact = parseExact(cell.text);
            if (!exact) continue;
            const targets = withoutSelf(
              resolveTargets(
                exact.parsed.value,
                document.moduleNumber,
                index,
                exact.qualifier,
              ),
              document,
              row.id,
            );
            if (targets.length === 0) continue;
            const reference: CellReference = {
              identifier: exact.parsed.value,
              targets,
            };
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

function splitLiteral(
  text: string,
  kind: "text" | "code",
  absoluteStart: number,
  skipOffset: number | null,
  resolve: Resolve,
): InlineRun[] {
  const pattern = new RegExp(IDENTIFIER_IN_TEXT.source, "g");
  const output: InlineRun[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null = pattern.exec(text);

  while (match) {
    const qualifierText = match[1];
    const identifier = match[2] ?? "";
    const parsed = parseIdentifier(identifier);
    const validQualifier =
      qualifierText === undefined ||
      (parsed !== null && parsed.scope === "module" && qualifierText.length === 2);
    if (!parsed || !validQualifier) {
      match = pattern.exec(text);
      continue;
    }

    const qualifier =
      qualifierText === undefined ? null : Number.parseInt(qualifierText, 10);
    const targets = resolve(parsed.value, qualifier);
    const isDefinition =
      skipOffset !== null && absoluteStart + match.index === skipOffset;
    if (targets.length === 0 || isDefinition) {
      match = pattern.exec(text);
      continue;
    }

    if (match.index > cursor) {
      output.push({ kind, text: text.slice(cursor, match.index) });
    }
    output.push({
      kind: "reference",
      text: qualifierText === undefined ? identifier : `${qualifierText} ${identifier}`,
      ref: { identifier: parsed.value, targets },
    });
    cursor = match.index + match[0].length;
    match = pattern.exec(text);
  }

  if (cursor === 0) return [{ kind, text }];
  if (cursor < text.length) output.push({ kind, text: text.slice(cursor) });
  return output;
}

function splitRuns(
  runs: readonly InlineRun[],
  baseOffset: number,
  skipOffset: number | null,
  resolve: Resolve,
): SplitResult {
  const output: InlineRun[] = [];
  let consumed = 0;

  for (const run of runs) {
    if (run.kind === "text" || run.kind === "code") {
      output.push(
        ...splitLiteral(run.text, run.kind, baseOffset + consumed, skipOffset, resolve),
      );
      consumed += run.text.length;
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

function isOwnItemDefinition(
  identifier: string | null,
  document: Document,
  anchor: string | null,
  text: string,
  resolve: Resolve,
): boolean {
  if (identifier === null) return false;
  const targets = resolve(identifier, null);
  return targets.some(
    (target) =>
      target.kind === "item" &&
      target.documentId === document.id &&
      target.anchor === anchor &&
      target.text === text,
  );
}

/**
 * Turns every valid identifier inside running text into a reference run. A
 * definition is not linked to itself; every other occurrence is, including code
 * spans and non-owner table cells. Unknown codes, rule identifiers and reserved
 * namespaces stay plain text.
 */
export function attachInlineReferences(
  documents: readonly Document[],
  index: Map<string, RefTarget[]>,
): Document[] {
  return documents.map((document) => {
    const resolve: Resolve = (identifier, qualifier) =>
      resolveTargets(identifier, document.moduleNumber, index, qualifier);

    let sectionAnchor: string | null = null;

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
        rows: table.rows.map((row) => {
          const resolveCell: Resolve = (identifier, qualifier) =>
            withoutSelf(resolve(identifier, qualifier), document, row.id);
          return {
            ...row,
            cells: row.cells.map((cell) => ({
              ...cell,
              runs: splitRuns(cell.runs, 0, null, resolveCell).runs,
            })),
          };
        }),
      })),
      nodes: document.nodes.map((node) => {
        switch (node.type) {
          case "heading": {
            const headingText = runsText(node.runs).trim();
            sectionAnchor = node.anchor;
            const leading = LEADING_IDENTIFIER.exec(headingText);
            const identifier = leading?.[1] ?? null;
            const definition = isOwnItemDefinition(
              identifier,
              document,
              node.anchor,
              headingText,
              resolve,
            );
            return {
              ...node,
              runs: splitRuns(node.runs, 0, definition ? 0 : null, resolve).runs,
            };
          }
          case "paragraph":
            return { ...node, runs: splitRuns(node.runs, 0, null, resolve).runs };
          case "quote":
            return { ...node, runs: splitRuns(node.runs, 0, null, resolve).runs };
          case "list": {
            const items = node.items.map((item) => {
              const text = runsText(item).trim();
              const leading = LEADING_IDENTIFIER.exec(text);
              const identifier = leading?.[1] ?? null;
              const definition = isOwnItemDefinition(
                identifier,
                document,
                sectionAnchor,
                text,
                resolve,
              );
              return splitRuns(item, 0, definition ? 0 : null, resolve).runs;
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
