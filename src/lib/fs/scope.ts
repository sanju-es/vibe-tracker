/**
 * Documentation scope shared by both folder adapters. D-39 bounds a project scan
 * to Markdown at the project root and the files under `docs/`, including
 * `docs/modules/**`. Images are indexed only from `docs/`. Detection itself is
 * shallow: it reads a directory listing and never walks the whole tree.
 */

export type EntryKind = "markdown" | "image" | "other";

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  "dist",
  "build",
  "coverage",
  "out",
  "tmp",
  "vendor",
]);

export function kindOf(path: string): EntryKind {
  if (/\.md$/i.test(path)) return "markdown";
  if (IMAGE_EXTENSIONS.test(path)) return "image";
  return "other";
}

/** A hidden entry is ignored by name, so new tool folders need no new entry. */
export function isIgnoredDirectory(name: string): boolean {
  return name.startsWith(".") || IGNORED_DIRECTORIES.has(name);
}

export function isIgnoredPath(path: string): boolean {
  return path.split("/").some(isIgnoredDirectory);
}

/**
 * Markdown selected by a project scan: files at the project root and any file
 * under `docs/`, which includes `docs/modules/**`.
 */
export function isProjectMarkdown(path: string): boolean {
  if (!/\.md$/i.test(path) || isIgnoredPath(path)) return false;
  const segments = path.split("/");
  return segments.length === 1 || segments[0] === "docs";
}

/**
 * Images selected by a project scan: only files under `docs/`. A root image or
 * an asset under `frontend/public` stays outside the documented area (D-39).
 */
export function isProjectImage(path: string): boolean {
  if (isIgnoredPath(path) || kindOf(path) !== "image") return false;
  const segments = path.split("/");
  return segments.length > 1 && segments[0] === "docs";
}

/** What enters a project scan: root/docs Markdown plus images under `docs/`. */
export function isProjectEntry(path: string): boolean {
  const kind = kindOf(path);
  if (kind === "markdown") return isProjectMarkdown(path);
  if (kind === "image") return isProjectImage(path);
  return false;
}

/** Backwards-compatible names used by the existing tests and callers. */
export function isDocumentationMarkdown(path: string): boolean {
  return isProjectMarkdown(path);
}

export function isDocumentationEntry(path: string): boolean {
  return isProjectEntry(path);
}
