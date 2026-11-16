import type { Document, ItemTarget, Project, StatusKey } from "./types";
import { moduleFolderName } from "./categories";
import { mapStatus } from "../semantics/status";
import { runsText } from "./text";

export interface DashboardModule {
  number: number;
  folder: string;
  name: string;
  state: string;
  stateKey: StatusKey | null;
  lastUpdate: string | null;
  active: boolean;
}

export interface DashboardCounts {
  total: number;
  tested: number;
  inProgress: number;
  pending: number;
  blocked: number;
  implemented: number;
  other: number;
}

export interface TimelineEntry {
  date: string;
  moduleNumber: number;
  moduleFolder: string;
  title: string;
  target: ItemTarget;
}

export interface DashboardSummary {
  modules: DashboardModule[];
  core: DashboardModule | null;
  counts: DashboardCounts;
  progress: { tested: number; total: number; percent: number };
  timeline: TimelineEntry[];
}

const IN_PROGRESS: readonly StatusKey[] = [
  "in-analysis",
  "implementation-proposal",
  "in-development",
];

function documentFor(
  project: Project,
  number: number,
  category: Document["category"],
): Document | null {
  return (
    project.documents.find(
      (document) => document.moduleNumber === number && document.category === category,
    ) ?? null
  );
}

function moduleEntry(
  project: Project,
  module: Project["modules"][number],
  active: number | null,
): DashboardModule {
  const summary = documentFor(project, module.number, "module-summary");
  const state = module.state ?? "—";
  return {
    number: module.number,
    folder: moduleFolderName(module.number, module.slug, module.name),
    name: module.name,
    state,
    stateKey: mapStatus(state).key,
    lastUpdate: summary?.meta.lastUpdate ?? null,
    active: module.number === active,
  };
}

function activeModuleNumber(project: Project): number | null {
  const state = project.documents.find((document) => document.category === "state");
  if (!state) return null;
  for (const node of state.nodes) {
    const text =
      node.type === "paragraph" || node.type === "quote"
        ? runsText(node.runs)
        : node.type === "list"
          ? node.items.map((item) => runsText(item)).join(" ")
          : "";
    const match = /Active module:\s*(?:(none)\b|(\d{1,2}))/i.exec(text);
    if (!match) continue;
    if (match[1]) return null;
    return Number.parseInt(match[2] ?? "", 10);
  }
  return null;
}

function timeline(project: Project): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  for (const module of project.modules) {
    const changelog = documentFor(project, module.number, "changelog");
    if (!changelog) continue;
    const folder = moduleFolderName(module.number, module.slug, module.name);
    for (const node of changelog.nodes) {
      if (node.type !== "heading" || node.level !== 2) continue;
      const text = runsText(node.runs).trim();
      const match = /^(\d{4}-\d{2}-\d{2})(?:\s*[—–-]\s*(.*))?$/.exec(text);
      if (!match) continue;
      entries.push({
        date: match[1] ?? "",
        moduleNumber: module.number,
        moduleFolder: folder,
        title: (match[2] ?? "").trim(),
        target: {
          kind: "item",
          documentId: changelog.id,
          documentTitle: changelog.title,
          moduleNumber: module.number,
          sectionTitle: null,
          anchor: node.anchor,
          text,
        },
      });
    }
  }

  return entries.sort(
    (a, b) => b.date.localeCompare(a.date) || a.moduleNumber - b.moduleNumber,
  );
}

/** Project-health summary: documented states, closable progress and history. */
export function dashboardSummary(project: Project): DashboardSummary {
  const active = activeModuleNumber(project);
  const modules = project.modules
    .filter((module) => module.number !== 0)
    .map((module) => moduleEntry(project, module, active));
  const coreModule = project.modules.find((module) => module.number === 0);
  const core = coreModule ? moduleEntry(project, coreModule, active) : null;

  const counts: DashboardCounts = {
    total: modules.length,
    tested: 0,
    inProgress: 0,
    pending: 0,
    blocked: 0,
    implemented: 0,
    other: 0,
  };

  for (const module of modules) {
    if (module.stateKey === "tested") counts.tested += 1;
    else if (module.stateKey !== null && IN_PROGRESS.includes(module.stateKey)) {
      counts.inProgress += 1;
    } else if (module.stateKey === "pending") counts.pending += 1;
    else if (module.stateKey === "blocked") counts.blocked += 1;
    else if (module.stateKey === "implemented") counts.implemented += 1;
    else counts.other += 1;
  }

  return {
    modules,
    core,
    counts,
    progress: {
      tested: counts.tested,
      total: counts.total,
      percent: counts.total === 0 ? 0 : Math.round((counts.tested / counts.total) * 100),
    },
    timeline: timeline(project),
  };
}
