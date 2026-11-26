import type { DashboardCounts } from "../model/dashboard";
import type { Project } from "../model/types";

/** Translated error key plus the path involved, when any. */
export interface WorkspaceError {
  key: string;
  path?: string;
}

/** Current documented state of one project, before opening it. */
export interface ProjectSummary {
  counts: DashboardCounts;
  progress: { tested: number; total: number; percent: number };
  activeModule: string | null;
  lastUpdate: string | null;
}

export interface WorkspaceProject {
  /** Relative project root: "" for the selected root, "alpha" for a child. */
  id: string;
  name: string;
  path: string;
  summary: ProjectSummary | null;
  project: Project | null;
  error: WorkspaceError | null;
}

export interface Workspace {
  mode: "single" | "portfolio";
  rootName: string;
  projects: WorkspaceProject[];
  selectedId: string | null;
}
