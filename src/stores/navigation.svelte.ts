import type { Project } from "../lib/model/types";

export type ActiveView =
  "document" | "modules" | "module" | "backlog" | "requirements" | "dashboard" | "search";

class NavigationStore {
  activeView = $state<ActiveView>("document");
  activeDocumentId = $state<string | null>(null);
  activeModuleNumber = $state<number | null>(null);
  pendingAnchor = $state<string | null>(null);
  pendingRowId = $state<string | null>(null);
  modulesExpanded = $state(true);
  otherExpanded = $state(false);
  expandedModules = $state<Record<number, boolean>>({});

  select(
    documentId: string,
    anchor: string | null = null,
    rowId: string | null = null,
  ): void {
    this.activeView = "document";
    this.activeDocumentId = documentId;
    this.pendingAnchor = anchor;
    this.pendingRowId = rowId;
  }

  clearPendingTarget(): void {
    this.pendingAnchor = null;
    this.pendingRowId = null;
  }

  openModules(): void {
    this.activeView = "modules";
    this.activeModuleNumber = null;
    this.modulesExpanded = true;
  }

  openModule(moduleNumber: number): void {
    this.activeView = "module";
    this.activeModuleNumber = moduleNumber;
  }

  openBacklog(): void {
    this.activeView = "backlog";
    this.activeModuleNumber = null;
  }

  openRequirements(): void {
    this.activeView = "requirements";
    this.activeModuleNumber = null;
  }

  openDashboard(): void {
    this.activeView = "dashboard";
    this.activeModuleNumber = null;
  }

  openSearch(): void {
    this.activeView = "search";
    this.activeModuleNumber = null;
  }

  toggleModules(): void {
    this.modulesExpanded = !this.modulesExpanded;
  }

  toggleOther(): void {
    this.otherExpanded = !this.otherExpanded;
  }

  toggleModule(moduleNumber: number): void {
    this.expandedModules = {
      ...this.expandedModules,
      [moduleNumber]: !this.expandedModules[moduleNumber],
    };
  }

  isModuleExpanded(moduleNumber: number): boolean {
    return this.expandedModules[moduleNumber] ?? false;
  }

  /** Selects the project state document after a scan. */
  reset(project: Project): void {
    const preferred =
      project.documents.find((document) => document.category === "state") ??
      project.documents[0] ??
      null;
    this.activeView = "document";
    this.activeDocumentId = preferred?.id ?? null;
    this.activeModuleNumber = null;
    this.pendingAnchor = null;
    this.pendingRowId = null;
    this.modulesExpanded = true;
    this.otherExpanded = false;
    this.expandedModules = {};
  }
}

export const navigation = new NavigationStore();
