/** Shared semantic model. Pure data: no HTML, no styling. */

export type Scope = "project" | "module";

export type CategoryId =
  | "state"
  | "architecture"
  | "decisions"
  | "workflow"
  | "standard"
  | "agents"
  | "readme"
  | "module-summary"
  | "requirements"
  | "technical"
  | "changelog"
  | "backlog"
  | "other";

export type StatusKey =
  | "pending"
  | "in-analysis"
  | "implementation-proposal"
  | "in-development"
  | "implemented"
  | "tested"
  | "blocked"
  | "active"
  | "new"
  | "in-progress"
  | "deferred"
  | "discarded"
  | "moved"
  | "draft"
  | "proposed"
  | "approved"
  | "current"
  | "superseded"
  | "archived";

export interface Status {
  value: string;
  key: StatusKey | null;
}

export type LinkKind = "document" | "anchor" | "image" | "external" | "broken";

export type InlineRun = {
  kind: "text" | "strong" | "em" | "code" | "link" | "image" | "reference" | "break";
  text: string;
  href?: string;
  linkKind?: LinkKind;
  targetPath?: string;
  anchor?: string;
  title?: string | null;
  children?: InlineRun[];
  ref?: CellReference;
};

/** Front-block field of a live document, in the order it appears. */
export interface FrontField {
  key: string;
  runs: InlineRun[];
}

/** `**Status:**` line: the token and its optional date. */
export interface DocumentStatus {
  token: string;
  date: string | null;
}

/** Typed metadata read from the universal skeleton. */
export interface DocumentMeta {
  fields: FrontField[];
  status: DocumentStatus | null;
  lastUpdate: string | null;
  history: string | null;
}

export type BlockNode =
  | { type: "heading"; level: number; anchor: string; runs: InlineRun[] }
  | { type: "paragraph"; runs: InlineRun[] }
  | { type: "list"; ordered: boolean; items: InlineRun[][] }
  | { type: "code"; language: string | null; text: string }
  | { type: "quote"; runs: InlineRun[] }
  | { type: "table"; tableId: string }
  | { type: "image"; path: string; alt: string; title: string | null }
  | { type: "rule" }
  | { type: "unknown"; tokenType: string; text: string };

export interface Section {
  id: string;
  level: number;
  text: string;
  anchor: string;
  position: number;
}

export interface RowTarget {
  kind: "row";
  documentId: string;
  documentTitle: string;
  moduleNumber: number | null;
  tableId: string;
  rowId: string;
  headers: string[];
  cells: Cell[];
}

export interface ItemTarget {
  kind: "item";
  documentId: string;
  documentTitle: string;
  moduleNumber: number | null;
  sectionTitle: string | null;
  anchor: string | null;
  text: string;
}

export type RefTarget = RowTarget | ItemTarget;

export interface CellReference {
  identifier: string;
  targets: RefTarget[];
}

export interface Cell {
  column: number;
  text: string;
  runs: InlineRun[];
  ref: CellReference | null;
}

export interface Row {
  id: string;
  cells: Cell[];
}

export interface Table {
  id: string;
  headers: string[];
  rows: Row[];
  statusColumn: number | null;
}

export interface Document {
  id: string;
  path: string;
  fileName: string;
  title: string;
  scope: Scope;
  moduleNumber: number | null;
  moduleSlug: string | null;
  category: CategoryId;
  nodes: BlockNode[];
  sections: Section[];
  tables: Table[];
  meta: DocumentMeta;
}

export interface ModuleInfo {
  number: number;
  slug: string;
  name: string;
  state: string | null;
}

export interface ImageAsset {
  path: string;
  alt: string;
  documentId: string;
}

export interface Project {
  name: string;
  documents: Document[];
  modules: ModuleInfo[];
  images: ImageAsset[];
  duplicateIdentifiers: string[];
}
