import { pickFolder, type FolderSource } from "../lib/fs/source";
import { buildProject } from "../lib/project/build";
import type { Project } from "../lib/model/types";

export type ScanStatus = "idle" | "scanning" | "ready" | "error";

export interface ProjectError {
  key: string;
  path?: string;
}

class ProjectStore {
  status = $state<ScanStatus>("idle");
  project = $state<Project | null>(null);
  error = $state<ProjectError | null>(null);
  progress = $state({ done: 0, total: 0 });
  warning = $state(false);

  #source: FolderSource | null = null;
  #controller: AbortController | null = null;
  #imageUrls = new Map<string, string>();
  #imageFailed = new Set<string>();
  #pendingImages = new Map<string, Promise<string | null>>();

  get name(): string {
    return this.project?.name ?? "";
  }

  async openFolder(): Promise<void> {
    this.#cancel();
    this.error = null;

    let source: FolderSource | null = null;
    try {
      source = await pickFolder();
    } catch {
      this.#fail({ key: "error.unsupportedBrowser" });
      return;
    }
    if (!source) {
      if (this.project === null) this.status = "idle";
      return;
    }

    this.#source = source;
    await this.#load(source);
  }

  /** Re-reads the current folder without asking for it again. */
  async reload(): Promise<void> {
    const source = this.#source;
    if (!source) {
      await this.openFolder();
      return;
    }
    this.#cancel();
    this.error = null;
    await this.#load(source);
  }

  async #load(source: FolderSource): Promise<void> {
    let entries = source.entries;
    if (source.refresh) {
      try {
        entries = await source.refresh();
      } catch {
        this.#fail({ key: "error.permissionRevoked" });
        return;
      }
    }

    const markdown = entries.filter((entry) => entry.kind === "markdown");
    if (markdown.length === 0) {
      this.#fail({ key: "error.noMarkdown" });
      return;
    }

    this.#releaseImages();
    this.progress = { done: 0, total: markdown.length };
    this.warning = markdown.length > 500;
    this.status = "scanning";

    const controller = new AbortController();
    this.#controller = controller;
    const files: { path: string; text: string }[] = [];

    for (const entry of markdown) {
      if (controller.signal.aborted) return;
      try {
        const text = await source.readText(entry.path);
        files.push({ path: entry.path, text });
      } catch {
        this.#fail({ key: "error.readFile", path: entry.path });
        return;
      }
      this.progress = { done: files.length, total: markdown.length };
    }

    if (controller.signal.aborted) return;

    try {
      this.project = buildProject({ name: source.name, files });
      this.status = "ready";
    } catch {
      this.#fail({ key: "error.generic" });
    }
  }

  cancelScan(): void {
    this.#cancel();
    if (this.project === null) this.status = "idle";
    else this.status = "ready";
  }

  retry(): void {
    void this.openFolder();
  }

  async loadImage(path: string): Promise<string | null> {
    const cached = this.#imageUrls.get(path);
    if (cached) return cached;
    if (this.#imageFailed.has(path)) return null;
    if (!this.#source) return null;
    const pending = this.#pendingImages.get(path);
    if (pending) return pending;

    const source = this.#source;
    const task = (async () => {
      try {
        const blob = await source.readBlob(path);
        const url = URL.createObjectURL(blob);
        this.#imageUrls.set(path, url);
        return url;
      } catch {
        this.#imageFailed.add(path);
        return null;
      } finally {
        this.#pendingImages.delete(path);
      }
    })();

    this.#pendingImages.set(path, task);
    return task;
  }

  #cancel(): void {
    this.#controller?.abort();
    this.#controller = null;
  }

  #fail(error: ProjectError): void {
    this.error = error;
    this.status = "error";
  }

  #releaseImages(): void {
    for (const url of this.#imageUrls.values()) URL.revokeObjectURL(url);
    this.#imageUrls.clear();
    this.#imageFailed.clear();
    this.#pendingImages.clear();
  }
}

export const projectStore = new ProjectStore();
