/**
 * Documentation scope shared by both folder adapters. The policy is deliberately
 * path-based: a Markdown document belongs to the project when it sits at the
 * selected root or below `docs/`. Any other folder is outside the policy, so a
 * tool folder, a sibling project or a source README never enters the reader.
 * Hidden, dependency, tooling and build folders are ignored even inside `docs/`.
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
 * The documentation policy for Markdown. The root holds the global documents;
 * `docs/` holds the rest. A Markdown file anywhere else is not documentation.
 */
export function isDocumentationMarkdown(path: string): boolean {
  if (!/\.md$/i.test(path) || isIgnoredPath(path)) return false;
  const segments = path.split("/");
  return segments.length === 1 || segments[0] === "docs";
}

/**
 * What enters the scan: Markdown under the policy plus images from any
 * non-ignored folder, because a document may reference an image outside `docs/`.
 */
export function isDocumentationEntry(path: string): boolean {
  if (isIgnoredPath(path)) return false;
  const kind = kindOf(path);
  if (kind === "markdown") return isDocumentationMarkdown(path);
  return kind === "image";
}
