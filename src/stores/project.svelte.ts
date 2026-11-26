import { isProjectImage } from "../lib/fs/scope";
import { pickFolder, type FolderSource } from "../lib/fs/source";
import { buildProject } from "../lib/project/build";
import type { Project } from "../lib/model/types";
import { detectWorkspace, type ProjectRoot } from "../lib/workspace/detect";
import { listProjectFiles } from "../lib/workspace/files";
import { summarizeProject, summaryFromProject } from "../lib/workspace/summary";
import type { Workspace, WorkspaceError, WorkspaceProject } from "../lib/workspace/types";
import { navigation } from "./navigation.svelte";
import { reader } from "./reader.svelte";
import { search } from "./search.svelte";
import { tables } from "./tables.svelte";

export type ScanStatus = "idle" | "opening" | "scanning" | "ready" | "error";

export type ProjectError = WorkspaceError;

class ProjectStore {
  status = $state<ScanStatus>("idle");
  workspace = $state<Workspace | null>(null);
  project = $state<Project | null>(null);
  error = $state<ProjectError | null>(null);
  progress = $state({ done: 0, total: 0 });
  warning = $state(false);
  expandedProjects = $state<Record<string, boolean>>({});

  #source: FolderSource | null = null;
  #controller: AbortController | null = null;
  #imageUrls = new Map<string, string>();
  #imageFailed = new Set<string>();
  #pendingImages = new Map<string, Promise<string | null>>();

  focusProjectId = $state<string | null>(null);

  get name(): string {
    return this.project?.name ?? this.workspace?.rootName ?? "";
  }

  get isPortfolio(): boolean {
    return this.workspace?.mode === "portfolio" && this.project === null;
  }

  async openFolder(): Promise<void> {
    this.#cancel();
    this.error = null;

    let source: FolderSource | null = null;
    try {
      source = await pickFolder(() => {
        this.status = "opening";
      });
    } catch {
      this.#failGlobal({ key: "error.unsupportedBrowser" });
      return;
    }
    if (!source) {
      this.status = this.project || this.workspace ? "ready" : "idle";
      return;
    }

    this.#releaseImages();
    this.#source = source;
    await this.#openWorkspace(source);
  }

  async selectProject(id: string): Promise<void> {
    const workspace = this.workspace;
    const source = this.#source;
    if (!workspace || !source) return;
    const entry = workspace.projects.find((project) => project.id === id);
    if (!entry) return;

    this.expandProject(id);

    if (entry.project) {
      workspace.selectedId = id;
      this.error = null;
      this.project = entry.project;
      this.#resetScopedState(entry.project);
      this.status = "ready";
      return;
    }

    await this.#loadProject(source, entry);
  }

  async retryProject(id: string): Promise<void> {
    const entry = this.workspace?.projects.find((project) => project.id === id);
    const source = this.#source;
    if (!entry || !source) return;
    entry.error = null;
    entry.project = null;
    await this.#loadProject(source, entry);
  }

  isProjectExpanded(id: string): boolean {
    return this.expandedProjects[id] ?? false;
  }

  expandProject(id: string): void {
    if (this.expandedProjects[id]) return;
    this.expandedProjects = { ...this.expandedProjects, [id]: true };
  }

  toggleProject(id: string): void {
    const entry = this.workspace?.projects.find((project) => project.id === id);
    if (!entry) return;
    if (!entry.project) {
      void this.selectProject(id);
      return;
    }
    this.expandedProjects = {
      ...this.expandedProjects,
      [id]: !this.expandedProjects[id],
    };
  }

  activateProject(id: string): void {
    if (this.workspace?.selectedId === id) {
      this.toggleProject(id);
      return;
    }
    void this.selectProject(id);
    this.expandProject(id);
  }

  showPortfolio(): void {
    if (this.workspace?.mode !== "portfolio") return;
    this.focusProjectId = this.workspace.selectedId;
    this.workspace.selectedId = null;
    this.project = null;
    this.error = null;
    this.status = "ready";
    reader.close();
    search.reset();
    tables.resetAll();
  }

  clearFocusProject(): void {
    this.focusProjectId = null;
  }

  async reload(): Promise<void> {
    const source = this.#source;
    if (!source) {
      await this.openFolder();
      return;
    }
    this.#cancel();
    this.error = null;

    if (this.workspace?.mode === "portfolio" && this.project === null) {
      await this.#openWorkspace(source);
      return;
    }

    const entry = this.workspace?.projects.find(
      (project) => project.id === this.workspace?.selectedId,
    );
    if (!entry) {
      await this.#openWorkspace(source);
      return;
    }
    entry.project = null;
    await this.#loadProject(source, entry);
  }

  retry(): void {
    const entry = this.workspace?.projects.find(
      (project) => project.id === this.workspace?.selectedId,
    );
    if (entry && this.#source) {
      void this.retryProject(entry.id);
      return;
    }
    void this.openFolder();
  }

  cancelScan(): void {
    this.#cancel();
    if (this.workspace?.mode === "portfolio") {
      this.workspace.selectedId = null;
      this.project = null;
      this.status = "ready";
      return;
    }
    if (this.project) {
      this.status = "ready";
      return;
    }
    this.workspace = null;
    this.project = null;
    this.status = "idle";
  }

  async loadImage(path: string): Promise<string | null> {
    if (!isProjectImage(path)) return null;
    const workspace = this.workspace;
    const source = this.#source;
    if (!workspace || !source) return null;
    const entry = workspace.projects.find(
      (project) => project.id === workspace.selectedId,
    );
    if (!entry) return null;

    const key = `${entry.id}\u0000${path}`;
    const cached = this.#imageUrls.get(key);
    if (cached) return cached;
    if (this.#imageFailed.has(key)) return null;
    const pending = this.#pendingImages.get(key);
    if (pending) return pending;

    const sourcePath = entry.id === "" ? path : `${entry.id}/${path}`;
    const task = (async () => {
      try {
        const blob = await source.readBlob(sourcePath);
        const url = URL.createObjectURL(blob);
        this.#imageUrls.set(key, url);
        return url;
      } catch {
        this.#imageFailed.add(key);
        return null;
      } finally {
        this.#pendingImages.delete(key);
      }
    })();

    this.#pendingImages.set(key, task);
    return task;
  }

  async #openWorkspace(source: FolderSource): Promise<void> {
    this.#cancel();
    this.#releaseImages();
    this.expandedProjects = {};
    const controller = new AbortController();
    this.#controller = controller;

    this.workspace = null;
    this.project = null;
    this.error = null;
    this.warning = false;
    this.status = "opening";

    let detection;
    try {
      detection = await detectWorkspace(source);
    } catch {
      this.#failGlobal({ key: "error.generic" });
      return;
    }
    if (controller.signal.aborted) return;

    const projects = detection.projects.map((root) => this.#entry(root));
    this.workspace = {
      mode: detection.mode,
      rootName: source.name,
      projects,
      selectedId: null,
    };

    if (detection.mode === "single") {
      const entry = projects[0];
      if (entry) await this.#loadProject(source, entry);
      return;
    }

    this.warning = projects.length > 10;
    this.status = "scanning";
    this.progress = { done: 0, total: projects.length };

    for (const entry of projects) {
      if (controller.signal.aborted) return;
      try {
        entry.summary = await summarizeProject(source, entry.id);
      } catch {
        entry.error = { key: "error.projectSummary" };
      }
      this.progress = { done: this.progress.done + 1, total: projects.length };
    }

    if (controller.signal.aborted) return;
    this.#controller = null;
    this.status = "ready";
  }

  async #loadProject(source: FolderSource, entry: WorkspaceProject): Promise<void> {
    this.#cancel();
    this.#releaseImages();
    const controller = new AbortController();
    this.#controller = controller;

    this.error = null;
    entry.error = null;
    if (this.workspace) this.workspace.selectedId = entry.id;
    this.project = null;
    this.status = "scanning";

    let files;
    try {
      files = await listProjectFiles(source, entry.id);
    } catch {
      this.#projectFailed(entry, { key: "error.generic" });
      return;
    }

    const markdown = files.filter((file) => file.kind === "markdown");
    if (markdown.length === 0) {
      this.#projectFailed(entry, { key: "error.noMarkdown" });
      return;
    }

    this.progress = { done: 0, total: markdown.length };
    this.warning = markdown.length > 500;
    const sourceFiles: { path: string; text: string }[] = [];

    for (const file of markdown) {
      if (controller.signal.aborted) return;
      const sourcePath = entry.id === "" ? file.path : `${entry.id}/${file.path}`;
      try {
        sourceFiles.push({
          path: file.path,
          text: await source.readText(sourcePath),
        });
      } catch {
        this.#projectFailed(entry, {
          key: "error.readFile",
          path: file.path,
        });
        return;
      }
      this.progress = { done: sourceFiles.length, total: markdown.length };
    }

    if (controller.signal.aborted) return;

    try {
      const project = buildProject({ name: entry.name, files: sourceFiles });
      entry.project = project;
      try {
        entry.summary = summaryFromProject(project);
      } catch {
        // Keep the portfolio summary when the card refresh cannot be derived.
      }
      this.project = project;
      this.#controller = null;
      this.status = "ready";
      this.#resetScopedState(project);
    } catch {
      this.#projectFailed(entry, { key: "error.generic" });
    }
  }

  #entry(root: ProjectRoot): WorkspaceProject {
    return {
      id: root.id,
      name: root.name,
      path: root.path,
      summary: null,
      project: null,
      error: null,
    };
  }

  #projectFailed(entry: WorkspaceProject, error: ProjectError): void {
    entry.error = error;
    entry.project = null;
    this.project = null;
    if (this.workspace?.mode === "portfolio") {
      this.workspace.selectedId = null;
      this.error = null;
      this.status = "ready";
      return;
    }
    this.error = error;
    this.status = "error";
  }

  #resetScopedState(project: Project): void {
    navigation.reset(project);
    reader.close();
    search.reset();
    tables.resetAll();
  }

  #cancel(): void {
    this.#controller?.abort();
    this.#controller = null;
  }

  #failGlobal(error: ProjectError): void {
    this.error = error;
    this.project = null;
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
