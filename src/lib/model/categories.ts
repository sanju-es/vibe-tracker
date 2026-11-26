import type { CategoryId, Scope } from "./types";
import { slugify } from "../format/text";

const PROJECT_CATEGORIES: Record<string, CategoryId> = {
  "PROJECT_STATE.md": "state",
  "README.md": "readme",
  "AGENTS.md": "agents",
  "ARCHITECTURE.md": "architecture",
  "DECISIONS.md": "decisions",
  "WORKFLOW.md": "workflow",
  "DOC-STANDARD.md": "standard",
};

const MODULE_CATEGORIES: Record<string, CategoryId> = {
  "MODULE.md": "module-summary",
  "REQUIREMENTS.md": "requirements",
  "TECHNICAL.md": "technical",
  "CHANGELOG.md": "changelog",
  "BACKLOG.md": "backlog",
};

/** Category of a document, derived from its file name only. */
export function categoryForFile(fileName: string, scope: Scope): CategoryId {
  const map = scope === "module" ? MODULE_CATEGORIES : PROJECT_CATEGORIES;
  return map[fileName] ?? "other";
}

/** Display order of the categories inside each navigation block. */
export const CATEGORY_ORDER: readonly CategoryId[] = [
  "state",
  "architecture",
  "decisions",
  "workflow",
  "standard",
  "agents",
  "readme",
  "module-summary",
  "requirements",
  "technical",
  "changelog",
  "backlog",
  "other",
];

export interface ModulePathInfo {
  number: number;
  slug: string;
}

const MODULE_PATH = /(?:^|\/)docs\/modules\/(\d{1,2})-([a-z0-9-]+)\//;

/** Reads `docs/modules/NN-slug/...` and returns number and slug, or null. */
export function moduleInfoFromPath(path: string): ModulePathInfo | null {
  const match = MODULE_PATH.exec(path);
  if (!match) return null;
  const number = Number.parseInt(match[1] ?? "", 10);
  const slug = match[2] ?? "";
  if (!Number.isFinite(number) || slug === "") return null;
  return { number, slug };
}

/** Last path segment. */
export function fileNameOf(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? path;
}

/** Folder name of a module: `00-core`, `01-structured-reader`. */
export function moduleFolderName(number: number, slug: string, name = ""): string {
  const folder = slug || slugify(name) || String(number);
  return `${String(number).padStart(2, "0")}-${folder}`;
}

/** Document title: first heading, or the file name without extension. */
export function fallbackTitle(path: string): string {
  const name = fileNameOf(path);
  return name.replace(/\.md$/i, "");
}
