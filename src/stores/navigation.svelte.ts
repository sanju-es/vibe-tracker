import type { Project } from "../lib/model/types";

export type ActiveView = "document" | "modules" | "module";

class NavigationStore {
  activeView = $state<ActiveView>("document");
  activeDocumentId = $state<string | null>(null);
  activeModuleNumber = $state<number | null>(null);
  modulesExpanded = $state(true);
  otherExpanded = $state(false);
  expandedModules = $state<Record<number, boolean>>({});

  select(documentId: string): void {
    this.activeView = "document";
    this.activeDocumentId = documentId;
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
    this.modulesExpanded = true;
    this.otherExpanded = false;
    this.expandedModules = {};
  }
}

export const navigation = new NavigationStore();
