import { marked } from "marked";
import type { Token } from "marked";
import type {
  BlockNode,
  Cell,
  DocumentMeta,
  FrontField,
  InlineRun,
  LinkKind,
  Row,
  Section,
  Table,
} from "../model/types";
import { slugify } from "../format/text";
import { detectStatusColumn } from "../semantics/status";

export interface ParsedDocument {
  blocks: BlockNode[];
  sections: Section[];
  tables: Table[];
  meta: DocumentMeta;
}

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

export function classifyHref(href: string): LinkKind {
  const value = href.trim();
  if (value === "") return "broken";
  if (value.startsWith("#")) return "anchor";
  if (/^(https?:|mailto:)/i.test(value)) return "external";
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return "broken";
  const path = value.split("#")[0]?.split("?")[0] ?? "";
  if (IMAGE_EXTENSIONS.test(path)) return "image";
  if (/\.md$/i.test(path)) return "document";
  return "broken";
}

function plainText(runs: InlineRun[]): string {
  return runs
    .map((run) => {
      if (run.kind === "image") return run.text;
      if (run.children && run.children.length > 0) return plainText(run.children);
      return run.text;
    })
    .join("");
}

function inlineFrom(tokens: Token[] | undefined): InlineRun[] {
  if (!tokens) return [];
  const runs: InlineRun[] = [];
  for (const token of tokens) {
    switch (token.type) {
      case "text": {
        const children = "tokens" in token ? token.tokens : undefined;
        if (children && children.length > 0) runs.push(...inlineFrom(children));
        else runs.push({ kind: "text", text: token.text });
        break;
      }
      case "escape":
      case "html":
        if (token.type === "html" && /^<br\s*\/?>$/i.test(token.text.trim())) {
          runs.push({ kind: "break", text: "\n" });
        } else {
          runs.push({ kind: "text", text: token.text });
        }
        break;
      case "br":
        runs.push({ kind: "break", text: "\n" });
        break;
      case "strong":
        runs.push({
          kind: "strong",
          text: token.text,
          children: inlineFrom(token.tokens),
        });
        break;
      case "em":
        runs.push({ kind: "em", text: token.text, children: inlineFrom(token.tokens) });
        break;
      case "del":
        runs.push({ kind: "em", text: token.text, children: inlineFrom(token.tokens) });
        break;
      case "codespan":
        runs.push({ kind: "code", text: token.text });
        break;
      case "link": {
        const linkKind = classifyHref(token.href);
        const hashIndex = token.href.indexOf("#");
        runs.push({
          kind: "link",
          text: token.text,
          href: token.href,
          linkKind,
          targetPath:
            linkKind === "document" || linkKind === "image"
              ? token.href.split("#")[0]
              : undefined,
          anchor: hashIndex >= 0 ? token.href.slice(hashIndex + 1) : undefined,
          children: inlineFrom(token.tokens),
        });
        break;
      }
      case "image":
        runs.push({
          kind: "image",
          text: token.text,
          href: token.href,
          title: token.title ?? null,
          targetPath: /^[a-z][a-z0-9+.-]*:/i.test(token.href)
            ? undefined
            : token.href.split("#")[0],
        });
        break;
      default:
        if ("text" in token && typeof token.text === "string") {
          runs.push({ kind: "text", text: token.text });
        }
    }
  }
  return runs;
}

interface CellToken {
  text: string;
  tokens?: Token[];
}

function cellFrom(column: number, token: CellToken): Cell {
  const runs = inlineFrom(token.tokens);
  const text = (plainText(runs) || token.text || "").trim();
  return { column, text, runs, ref: null };
}

function listRuns(token: Token): InlineRun[] {
  if (!("tokens" in token) || !Array.isArray(token.tokens)) return [];
  const runs: InlineRun[] = [];
  for (const child of token.tokens) {
    if (child.type === "paragraph" || child.type === "text") {
      runs.push(...inlineFrom(child.tokens));
    } else if (child.type === "list") {
      for (const item of child.items) {
        runs.push(...listRuns(item));
        runs.push({ kind: "text", text: " " });
      }
    }
  }
  return runs;
}

const FRONT_KEY_PATTERN =
  /^>\s*\*\*(Purpose|Read when|Canonical for|Do not duplicate):\*\*\s*(.*)$/;
const LINE_KEY_PATTERN = /^\*\*(Status|Last update|History):\*\*\s*(.*)$/;
const CONTINUATION_PATTERN = /^>\s?(.*)$/;

/** Inline runs from a single field value, without producing HTML. */
function runsFromText(value: string): InlineRun[] {
  if (value.trim() === "") return [];
  const tokens = marked.lexer(value);
  const paragraph = tokens.find(
    (token) => token.type === "paragraph" || token.type === "text",
  );
  if (paragraph && "tokens" in paragraph) return inlineFrom(paragraph.tokens);
  return [{ kind: "text", text: value }];
}

function parseStatus(value: string): { token: string; date: string | null } {
  const backticked = /`([^`]+)`/.exec(value);
  const token = (backticked?.[1] ?? value.replace(/\s*\(.*\)\s*$/, "")).trim();
  const date = /\((\d{4}-\d{2}-\d{2})\)/.exec(value)?.[1] ?? null;
  return { token, date };
}

/**
 * Reads the universal skeleton (front block, status, last update, history) and
 * removes those lines from the body. Only the canonical form is interpreted.
 */
function readMeta(source: string): { meta: DocumentMeta; source: string } {
  const lines = source.split("\n");
  const fields: FrontField[] = [];
  let status: { token: string; date: string | null } | null = null;
  let lastUpdate: string | null = null;
  let history: string | null = null;
  let current: FrontField | null = null;

  const limit = Math.min(lines.length, 80);
  for (let index = 0; index < limit; index += 1) {
    const line = lines[index] ?? "";
    const front = FRONT_KEY_PATTERN.exec(line);
    if (front) {
      const field: FrontField = {
        key: front[1] ?? "",
        runs: runsFromText(front[2] ?? ""),
      };
      fields.push(field);
      current = field;
      lines[index] = "";
      continue;
    }
    const keyLine = LINE_KEY_PATTERN.exec(line);
    if (keyLine) {
      const key = keyLine[1];
      const value = (keyLine[2] ?? "").trim();
      if (key === "Status") status = parseStatus(value);
      if (key === "Last update")
        lastUpdate = /(\d{4}-\d{2}-\d{2})/.exec(value)?.[1] ?? value;
      if (key === "History") history = value;
      current = null;
      lines[index] = "";
      continue;
    }
    const continuation = CONTINUATION_PATTERN.exec(line);
    if (continuation && current) {
      const text = (continuation[1] ?? "").trim();
      if (text !== "") {
        current.runs.push({ kind: "text", text: ` ${text}` });
      }
      lines[index] = "";
      continue;
    }
    if (/^##\s/.test(line)) break;
    if (line.trim() === "") {
      current = null;
      continue;
    }
    if (
      /^---+$/.test(line.trim()) &&
      (fields.length > 0 || status || lastUpdate || history)
    ) {
      lines[index] = "";
      break;
    }
    current = null;
  }

  return {
    meta: { fields, status, lastUpdate, history },
    source: lines.join("\n"),
  };
}

/** Converts Markdown into the semantic model. Never produces HTML. */
export function parseDocument(documentId: string, source: string): ParsedDocument {
  const normalized = source.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const { meta, source: body } = readMeta(normalized);
  const blocks: BlockNode[] = [];
  const sections: Section[] = [];
  const tables: Table[] = [];
  const usedAnchors = new Set<string>();
  let tableIndex = 0;

  const uniqueAnchor = (text: string): string => {
    const base = slugify(text) || "section";
    let candidate = base;
    let suffix = 2;
    while (usedAnchors.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    usedAnchors.add(candidate);
    return candidate;
  };

  const tokens = marked.lexer(body);

  for (const token of tokens) {
    switch (token.type) {
      case "heading": {
        const runs = inlineFrom(token.tokens);
        const text = plainText(runs) || token.text;
        const anchor = uniqueAnchor(text);
        blocks.push({ type: "heading", level: token.depth, anchor, runs });
        sections.push({
          id: `${documentId}#${anchor}`,
          level: token.depth,
          text,
          anchor,
          position: blocks.length - 1,
        });
        break;
      }
      case "paragraph": {
        blocks.push({ type: "paragraph", runs: inlineFrom(token.tokens) });
        break;
      }
      case "text": {
        blocks.push({ type: "paragraph", runs: inlineFrom(token.tokens) });
        break;
      }
      case "blockquote": {
        blocks.push({ type: "quote", runs: inlineFrom(token.tokens) });
        break;
      }
      case "code": {
        blocks.push({ type: "code", language: token.lang ?? null, text: token.text });
        break;
      }
      case "list": {
        const items = token.items.map((item: Token) => listRuns(item));
        blocks.push({ type: "list", ordered: Boolean(token.ordered), items });
        break;
      }
      case "table": {
        tableIndex += 1;
        const tableId = `${documentId}#table-${tableIndex}`;
        const headers = token.header.map((cell: CellToken) => (cell.text || "").trim());
        const rows: Row[] = token.rows.map((row: CellToken[], rowIndex: number) => ({
          id: `${tableId}-r${rowIndex + 1}`,
          cells: row.map((cell: CellToken, column: number) => cellFrom(column, cell)),
        }));
        tables.push({
          id: tableId,
          headers,
          rows,
          statusColumn: detectStatusColumn(headers),
        });
        blocks.push({ type: "table", tableId });
        break;
      }
      case "hr": {
        blocks.push({ type: "rule" });
        break;
      }
      case "space":
      case "def":
        break;
      case "html": {
        blocks.push({ type: "unknown", tokenType: "html", text: token.text });
        break;
      }
      default: {
        blocks.push({
          type: "unknown",
          tokenType: token.type,
          text: "raw" in token && typeof token.raw === "string" ? token.raw : "",
        });
      }
    }
  }

  return { blocks, sections, tables, meta };
}
