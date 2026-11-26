import type { CategoryId, Document, Project } from "./types";
import { CATEGORY_ORDER, moduleFolderName } from "./categories";
import { runsText } from "./text";

export type SearchKind = "heading" | "body" | "table" | "front-block";

export interface SearchMatch {
  documentId: string;
  documentTitle: string;
  category: CategoryId;
  moduleNumber: number | null;
  moduleFolder: string | null;
  sectionTitle: string | null;
  anchor: string | null;
  rowId: string | null;
  kind: SearchKind;
  before: string;
  match: string;
  after: string;
}

export interface SearchGroup {
  documentId: string;
  documentTitle: string;
  category: CategoryId;
  moduleNumber: number | null;
  moduleFolder: string | null;
  matches: SearchMatch[];
}

export interface IndexGroup {
  category: CategoryId;
  documents: Document[];
}

interface Excerpt {
  before: string;
  match: string;
  after: string;
}

interface Candidate {
  match: SearchMatch;
  order: number;
}

const KIND_ORDER: Record<SearchKind, number> = {
  heading: 0,
  body: 1,
  table: 1,
  "front-block": 2,
};

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Normalises a string and keeps the original index of every normalised character. */
function normalizeWithMap(value: string): { value: string; map: number[] } {
  const chars: string[] = [];
  const map: number[] = [];
  for (let index = 0; index < value.length; index += 1) {
    for (const char of normalizeSearch(value[index] ?? "")) {
      chars.push(char);
      map.push(index);
    }
  }
  return { value: chars.join(""), map };
}

function excerpt(text: string, query: string, margin = 60): Excerpt | null {
  const needle = normalizeSearch(query).trim();
  if (needle === "") return null;
  const normalized = normalizeWithMap(text);
  const found = normalized.value.indexOf(needle);
  if (found < 0) return null;
  const start = normalized.map[found] ?? 0;
  const endChar = normalized.map[found + needle.length - 1] ?? start;
  const end = endChar + 1;
  const beforeStart = Math.max(0, start - margin);
  const afterEnd = Math.min(text.length, end + margin);
  return {
    before: `${beforeStart > 0 ? "…" : ""}${text.slice(beforeStart, start)}`,
    match: text.slice(start, end),
    after: `${text.slice(end, afterEnd)}${afterEnd < text.length ? "…" : ""}`,
  };
}

function folderOf(project: Project, document: Document): string | null {
  if (document.moduleNumber === null) return null;
  const module = project.modules.find((entry) => entry.number === document.moduleNumber);
  return module ? moduleFolderName(module.number, module.slug, module.name) : null;
}

function makeMatch(
  project: Project,
  document: Document,
  kind: SearchKind,
  text: string,
  query: string,
  sectionTitle: string | null,
  anchor: string | null,
  rowId: string | null,
  order: number,
): Candidate | null {
  const parts = excerpt(text, query);
  if (!parts) return null;
  return {
    order,
    match: {
      documentId: document.id,
      documentTitle: document.title,
      category: document.category,
      moduleNumber: document.moduleNumber,
      moduleFolder: folderOf(project, document),
      sectionTitle,
      anchor,
      rowId,
      kind,
      ...parts,
    },
  };
}

function tableMatches(
  project: Project,
  document: Document,
  documentNode: Document["nodes"][number],
  query: string,
  sectionTitle: string | null,
  sectionAnchor: string | null,
  startOrder: number,
): Candidate[] {
  if (documentNode.type !== "table") return [];
  const table = document.tables.find((entry) => entry.id === documentNode.tableId);
  if (!table) return [];
  const found: Candidate[] = [];
  let order = startOrder;
  for (const row of table.rows) {
    order += 1;
    const cell = row.cells.find((entry) => excerpt(entry.text, query) !== null);
    if (!cell) continue;
    const candidate = makeMatch(
      project,
      document,
      "table",
      cell.text,
      query,
      sectionTitle,
      sectionAnchor,
      row.id,
      order,
    );
    if (candidate) found.push(candidate);
  }
  return found;
}

/** Global search over every scanned document, grouped by document. */
export function searchProject(project: Project, query: string): SearchGroup[] {
  const needle = normalizeSearch(query).trim();
  if (needle === "") return [];

  const groups: SearchGroup[] = [];

  for (const document of project.documents) {
    const candidates: Candidate[] = [];
    let sectionTitle: string | null = null;
    let sectionAnchor: string | null = null;
    let order = 0;

    for (const field of document.meta.fields) {
      order += 1;
      const candidate = makeMatch(
        project,
        document,
        "front-block",
        runsText(field.runs),
        needle,
        null,
        null,
        null,
        order,
      );
      if (candidate) candidates.push(candidate);
    }

    for (const node of document.nodes) {
      order += 1;
      switch (node.type) {
        case "heading": {
          const text = runsText(node.runs);
          const candidate = makeMatch(
            project,
            document,
            "heading",
            text,
            needle,
            text,
            node.anchor,
            null,
            order,
          );
          if (candidate) candidates.push(candidate);
          sectionTitle = text;
          sectionAnchor = node.anchor;
          break;
        }
        case "paragraph":
        case "quote": {
          const candidate = makeMatch(
            project,
            document,
            "body",
            runsText(node.runs),
            needle,
            sectionTitle,
            sectionAnchor,
            null,
            order,
          );
          if (candidate) candidates.push(candidate);
          break;
        }
        case "list": {
          for (const item of node.items) {
            order += 1;
            const candidate = makeMatch(
              project,
              document,
              "body",
              runsText(item),
              needle,
              sectionTitle,
              sectionAnchor,
              null,
              order,
            );
            if (candidate) candidates.push(candidate);
          }
          break;
        }
        case "code": {
          const candidate = makeMatch(
            project,
            document,
            "body",
            node.text,
            needle,
            sectionTitle,
            sectionAnchor,
            null,
            order,
          );
          if (candidate) candidates.push(candidate);
          break;
        }
        case "table": {
          const found = tableMatches(
            project,
            document,
            node,
            needle,
            sectionTitle,
            sectionAnchor,
            order,
          );
          candidates.push(...found);
          order += found.length;
          break;
        }
        default:
          break;
      }
    }

    if (candidates.length === 0) continue;
    candidates.sort(
      (a, b) => KIND_ORDER[a.match.kind] - KIND_ORDER[b.match.kind] || a.order - b.order,
    );
    groups.push({
      documentId: document.id,
      documentTitle: document.title,
      category: document.category,
      moduleNumber: document.moduleNumber,
      moduleFolder: folderOf(project, document),
      matches: candidates.map((candidate) => candidate.match),
    });
  }

  return groups.sort((a, b) => {
    const left = CATEGORY_ORDER.indexOf(a.category);
    const right = CATEGORY_ORDER.indexOf(b.category);
    return left - right || a.documentId.localeCompare(b.documentId);
  });
}

/** Every document grouped by its category, for the empty search state. */
export function documentIndex(project: Project): IndexGroup[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    documents: project.documents
      .filter((document) => document.category === category)
      .sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id)),
  })).filter((group) => group.documents.length > 0);
}
