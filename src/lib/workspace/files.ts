import type { FolderSource } from "../fs/source";
import {
  isIgnoredDirectory,
  isProjectImage,
  isProjectMarkdown,
  kindOf,
} from "../fs/scope";

export interface ProjectFile {
  /** Path relative to the project root. */
  path: string;
  kind: "markdown" | "image";
}

function joinPath(prefix: string, name: string): string {
  return prefix === "" ? name : `${prefix}/${name}`;
}

async function walkDocs(
  source: FolderSource,
  directory: string,
  relative: string,
  files: ProjectFile[],
): Promise<void> {
  const entries = await source.list(directory);
  for (const entry of entries) {
    const childRelative = joinPath(relative, entry.name);
    if (entry.kind === "directory") {
      if (isIgnoredDirectory(entry.name)) continue;
      await walkDocs(source, joinPath(directory, entry.name), childRelative, files);
      continue;
    }
    if (isProjectMarkdown(childRelative) || isProjectImage(childRelative)) {
      files.push({
        path: childRelative,
        kind: kindOf(childRelative) === "image" ? "image" : "markdown",
      });
    }
  }
}

/**
 * Files selected for a project scan: Markdown at its root and every Markdown or
 * image under `docs/`, including `docs/modules/**`. No other subtree is listed.
 */
export async function listProjectFiles(
  source: FolderSource,
  rootId: string,
): Promise<ProjectFile[]> {
  const rootEntries = await source.list(rootId);
  const files: ProjectFile[] = [];

  for (const entry of rootEntries) {
    if (entry.kind === "file" && isProjectMarkdown(entry.name)) {
      files.push({ path: entry.name, kind: "markdown" });
    }
  }

  const docs = rootEntries.find(
    (entry) => entry.kind === "directory" && entry.name === "docs",
  );
  if (docs) {
    await walkDocs(source, joinPath(rootId, "docs"), "docs", files);
  }

  return files.sort((left, right) => left.path.localeCompare(right.path));
}

export async function listProjectMarkdown(
  source: FolderSource,
  rootId: string,
): Promise<string[]> {
  return (await listProjectFiles(source, rootId))
    .filter((file) => file.kind === "markdown")
    .map((file) => file.path);
}
