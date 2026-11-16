/**
 * Folder access. Two adapters behind one interface:
 * - the directory picker, when the origin allows it;
 * - a folder input, which works from a file opened from disk.
 * Nothing else in the app talks to these browser APIs.
 */

import {
  isDocumentationEntry,
  isIgnoredDirectory,
  kindOf,
  type EntryKind,
} from "./scope";

export interface FolderEntry {
  path: string;
  kind: EntryKind;
}

export interface FolderSource {
  name: string;
  entries: FolderEntry[];
  readText(path: string): Promise<string>;
  readBlob(path: string): Promise<Blob>;
  /** Re-reads the folder listing. Absent when the source is a fixed snapshot. */
  refresh?: () => Promise<FolderEntry[]>;
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
  getFileHandle(name: string): Promise<PickerFileHandle>;
}

interface PickerWindow {
  showDirectoryPicker?: (options?: { mode?: "read" }) => Promise<PickerDirectoryHandle>;
}

function joinPath(prefix: string, name: string): string {
  return prefix === "" ? name : `${prefix}/${name}`;
}

/** The picker is skipped on `file://`, where it is not available. */
function canUseDirectoryPicker(): boolean {
  if (typeof window === "undefined") return false;
  if (window.location.protocol === "file:") return false;
  return typeof (window as unknown as PickerWindow).showDirectoryPicker === "function";
}

async function walk(
  handle: PickerDirectoryHandle,
  prefix: string,
  files: Map<string, PickerFileHandle>,
  entries: FolderEntry[],
): Promise<void> {
  for await (const child of handle.values()) {
    const path = joinPath(prefix, child.name);
    if (child.kind === "directory") {
      if (isIgnoredDirectory(child.name)) continue;
      await walk(child, path, files, entries);
      continue;
    }
    if (!isDocumentationEntry(path)) continue;
    const kind = kindOf(path);
    entries.push({ path, kind });
    files.set(path, child);
  }
}

async function sourceFromHandle(
  handle: PickerDirectoryHandle,
  onStart: () => void,
): Promise<FolderSource> {
  const files = new Map<string, PickerFileHandle>();
  const entries: FolderEntry[] = [];

  onStart();
  await walk(handle, "", files, entries);

  const refresh = async (): Promise<FolderEntry[]> => {
    files.clear();
    entries.length = 0;
    await walk(handle, "", files, entries);
    return entries;
  };

  return {
    name: handle.name,
    entries,
    refresh,
    async readText(path) {
      const fileHandle = files.get(path);
      if (!fileHandle) throw new Error(`Missing file: ${path}`);
      const file = await fileHandle.getFile();
      return file.text();
    },
    async readBlob(path) {
      const fileHandle = files.get(path);
      if (!fileHandle) throw new Error(`Missing file: ${path}`);
      const file = await fileHandle.getFile();
      return file;
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
      const files = input.files ? Array.from(input.files) : [];
      if (files.length === 0) {
        finish(null);
        return;
      }
      onStart();
      void (async () => {
        // Let the opening state paint before the synchronous file enumeration.
        await new Promise((nextFrame) => setTimeout(nextFrame, 0));
        const byPath = new Map<string, File>();
        const entries: FolderEntry[] = [];
        const root = files[0]?.webkitRelativePath.split("/")[0] ?? "project";
        for (const file of files) {
          const relative = file.webkitRelativePath || file.name;
          const path = relative.split("/").slice(1).join("/") || file.name;
          if (!isDocumentationEntry(path)) continue;
          const kind = kindOf(path);
          entries.push({ path, kind });
          byPath.set(path, file);
        }
        finish({
          name: root,
          entries,
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
