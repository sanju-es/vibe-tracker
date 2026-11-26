/**
 * Folder access. Two adapters behind one interface:
 * - the directory picker, when the origin allows it;
 * - a folder input, which works from a file opened from disk.
 * Nothing else in the app talks to these browser APIs. The interface is shallow:
 * `list` returns the immediate entries of one directory and never walks a tree.
 */

import { isIgnoredDirectory, isProjectImage, isProjectMarkdown } from "./scope";

export type FolderEntryKind = "file" | "directory";

export interface FolderEntry {
  name: string;
  kind: FolderEntryKind;
}

export interface FolderSource {
  name: string;
  /** Immediate entries of one directory, relative to the selected root. */
  list(path: string): Promise<readonly FolderEntry[]>;
  readText(path: string): Promise<string>;
  readBlob(path: string): Promise<Blob>;
}

interface PickerFileHandle {
  kind: "file";
  name: string;
  getFile(): Promise<File>;
}

interface PickerDirectoryHandle {
  kind: "directory";
  name: string;
  values(): AsyncIterableIterator<PickerFileHandle | PickerDirectoryHandle>;
  getDirectoryHandle(name: string): Promise<PickerDirectoryHandle>;
  getFileHandle(name: string): Promise<PickerFileHandle>;
}

interface PickerWindow {
  showDirectoryPicker?: (options?: { mode?: "read" }) => Promise<PickerDirectoryHandle>;
}

function sortEntries(entries: FolderEntry[]): FolderEntry[] {
  return entries.sort(
    (left, right) =>
      Number(right.kind === "directory") - Number(left.kind === "directory") ||
      left.name.localeCompare(right.name),
  );
}

/** The picker is skipped on `file://`, where it is not available. */
function canUseDirectoryPicker(): boolean {
  if (typeof window === "undefined") return false;
  if (window.location.protocol === "file:") return false;
  return typeof (window as unknown as PickerWindow).showDirectoryPicker === "function";
}

async function directoryAt(
  root: PickerDirectoryHandle,
  path: string,
): Promise<PickerDirectoryHandle> {
  let current = root;
  for (const segment of path.split("/").filter(Boolean)) {
    current = await current.getDirectoryHandle(segment);
  }
  return current;
}

async function fileAt(
  root: PickerDirectoryHandle,
  path: string,
): Promise<PickerFileHandle> {
  const segments = path.split("/").filter(Boolean);
  const name = segments.pop();
  if (!name) throw new Error(`Missing file: ${path}`);
  const directory = await directoryAt(root, segments.join("/"));
  return directory.getFileHandle(name);
}

async function sourceFromHandle(
  handle: PickerDirectoryHandle,
  onStart: () => void,
): Promise<FolderSource> {
  onStart();

  return {
    name: handle.name,
    async list(path) {
      const directory = await directoryAt(handle, path);
      const entries: FolderEntry[] = [];
      for await (const child of directory.values()) {
        if (isIgnoredDirectory(child.name)) continue;
        entries.push({
          name: child.name,
          kind: child.kind === "directory" ? "directory" : "file",
        });
      }
      return sortEntries(entries);
    },
    async readText(path) {
      const fileHandle = await fileAt(handle, path);
      const file = await fileHandle.getFile();
      return file.text();
    },
    async readBlob(path) {
      const fileHandle = await fileAt(handle, path);
      return fileHandle.getFile();
    },
  };
}

function pickWithInput(onStart: () => void): Promise<FolderSource | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.setAttribute("webkitdirectory", "");
    input.style.display = "none";

    let settled = false;
    const finish = (source: FolderSource | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(source);
    };

    input.addEventListener("change", () => {
      const files = input.files;
      if (!files || files.length === 0) {
        finish(null);
        return;
      }
      void (async () => {
        // Let the opening state paint before indexing the file list.
        await new Promise((nextFrame) => setTimeout(nextFrame, 0));

        const byPath = new Map<string, File>();
        const index = new Map<string, Map<string, FolderEntryKind>>();
        const childRootFiles = new Map<string, Map<string, File>>();

        const add = (directory: string, name: string, kind: FolderEntryKind) => {
          let entries = index.get(directory);
          if (!entries) {
            entries = new Map();
            index.set(directory, entries);
          }
          entries.set(name, kind);
        };

        const addDocs = (base: string, segments: string[], start: number, file: File) => {
          let directory = base;
          for (let index = start; index < segments.length - 1; index += 1) {
            const name = segments[index] ?? "";
            add(directory, name, "directory");
            directory = directory === "" ? name : `${directory}/${name}`;
          }
          const name = segments[segments.length - 1] ?? "";
          add(directory, name, "file");
          const path = segments.join("/");
          const projectPath = segments.slice(start - 1).join("/");
          if (isProjectMarkdown(projectPath) || isProjectImage(projectPath)) {
            byPath.set(path, file);
          }
        };

        const root = files[0]?.webkitRelativePath.split("/")[0] ?? "project";

        for (let position = 0; position < files.length; position += 1) {
          // Yield periodically so the opening state remains responsive.
          if (position > 0 && position % 1000 === 0) {
            await new Promise((nextFrame) => setTimeout(nextFrame, 0));
          }
          const file = files[position];
          if (!file) continue;
          const relative = file.webkitRelativePath || file.name;
          const parts = relative.split("/");
          if (parts.length <= 1) continue;
          parts.shift(); // selected folder name
          if (parts.length === 0) continue;
          if (parts.some(isIgnoredDirectory)) continue;

          if (parts.length === 1) {
            const name = parts[0] ?? "";
            add("", name, "file");
            if (isProjectMarkdown(name)) byPath.set(name, file);
            continue;
          }

          if (parts[0] === "docs") {
            add("", "docs", "directory");
            addDocs("docs", parts, 1, file);
            continue;
          }

          if (parts.length > 2 && parts[1] === "docs") {
            const child = parts[0] ?? "";
            add("", child, "directory");
            add(child, "docs", "directory");
            addDocs(`${child}/docs`, parts, 2, file);
            continue;
          }

          if (parts.length === 2) {
            const child = parts[0] ?? "";
            const name = parts[1] ?? "";
            add("", child, "directory");
            add(child, name, "file");
            if (isProjectMarkdown(name)) {
              let childFiles = childRootFiles.get(child);
              if (!childFiles) {
                childFiles = new Map();
                childRootFiles.set(child, childFiles);
              }
              childFiles.set(name, file);
            }
            continue;
          }
        }

        // Child root Markdown belongs to the project only when the child is a
        // compatible project; this keeps `src/README.md` and similar paths out.
        for (const [child, filesByName] of childRootFiles) {
          const entries = index.get(child);
          if (!entries?.has("PROJECT_STATE.md") || !entries.has("docs")) continue;
          for (const [name, file] of filesByName) {
            byPath.set(`${child}/${name}`, file);
          }
        }

        const list = async (path: string): Promise<readonly FolderEntry[]> => {
          const entries = index.get(path);
          if (!entries) return [];
          return sortEntries([...entries].map(([name, kind]) => ({ name, kind })));
        };

        finish({
          name: root,
          list,
          async readText(path) {
            const file = byPath.get(path);
            if (!file) throw new Error(`Missing file: ${path}`);
            return file.text();
          },
          async readBlob(path) {
            const file = byPath.get(path);
            if (!file) throw new Error(`Missing file: ${path}`);
            return file;
          },
        });
      })();
    });

    input.addEventListener("cancel", () => finish(null));

    document.body.append(input);
    // Set the opening state before the native dialog; the change handler yields
    // once more before indexing so the state is visible when the dialog closes.
    onStart();
    input.click();
  });
}

export async function pickFolder(
  onStart: () => void = () => {},
): Promise<FolderSource | null> {
  if (canUseDirectoryPicker()) {
    try {
      const picker = (window as unknown as PickerWindow).showDirectoryPicker;
      if (picker) {
        const handle = await picker({ mode: "read" });
        return await sourceFromHandle(handle, onStart);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return null;
      // Any other failure falls back to the folder input.
    }
  }
  return pickWithInput(onStart);
}
