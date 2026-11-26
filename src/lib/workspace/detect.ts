import type { FolderEntry, FolderSource } from "../fs/source";
import { isIgnoredDirectory } from "../fs/scope";

export interface ProjectRoot {
  id: string;
  name: string;
  path: string;
}

export interface WorkspaceDetection {
  mode: "single" | "portfolio";
  projects: ProjectRoot[];
}

function isProjectRoot(entries: readonly FolderEntry[]): boolean {
  return (
    entries.some((entry) => entry.kind === "file" && entry.name === "PROJECT_STATE.md") &&
    entries.some((entry) => entry.kind === "directory" && entry.name === "docs")
  );
}

function singleProject(name: string, id: string): WorkspaceDetection {
  return {
    mode: "single",
    projects: [{ id, name, path: id }],
  };
}

/**
 * Detects a single project or a portfolio. Only the selected root and its
 * immediate children are listed; a child is a project when its own listing has
 * `PROJECT_STATE.md` and a `docs` directory. No folder is excluded by name,
 * marker or content (D-38), and no grandchild directory is listed (D-39).
 */
export async function detectWorkspace(source: FolderSource): Promise<WorkspaceDetection> {
  const rootEntries = await source.list("");
  if (isProjectRoot(rootEntries)) return singleProject(source.name, "");

  const children = rootEntries
    .filter((entry) => entry.kind === "directory" && !isIgnoredDirectory(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  const projects: ProjectRoot[] = [];
  for (const name of children) {
    const entries = await source.list(name);
    if (!isProjectRoot(entries)) continue;
    projects.push({ id: name, name, path: name });
  }

  if (projects.length >= 2) return { mode: "portfolio", projects };
  if (projects.length === 1) return { mode: "single", projects };
  return singleProject(source.name, "");
}
