import type { FolderSource } from "../fs/source";
import {
  dashboardSummary,
  activeModuleNumberFromBlocks,
  summarizeStates,
} from "../model/dashboard";
import { parseDocument } from "../markdown/pipeline";
import { moduleInfosFromPaths, mergeModules } from "../project/build";
import type { Project } from "../model/types";
import { mapStatus } from "../semantics/status";
import { listProjectMarkdown } from "./files";
import type { ProjectSummary } from "./types";

const EMPTY_SUMMARY: ProjectSummary = {
  counts: {
    total: 0,
    tested: 0,
    inProgress: 0,
    pending: 0,
    blocked: 0,
    implemented: 0,
    other: 0,
  },
  progress: { tested: 0, total: 0, percent: 0 },
  activeModule: null,
  lastUpdate: null,
};

/**
 * Current documented summary of one project. It reads `PROJECT_STATE.md` and the
 * project Markdown paths only; it never opens a module document, a changelog or a
 * backlog. The module merge is the same one used by `buildProject`.
 */
export async function summarizeProject(
  source: FolderSource,
  rootId: string,
): Promise<ProjectSummary> {
  const rootEntries = await source.list(rootId);
  const state = rootEntries.find(
    (entry) => entry.kind === "file" && entry.name === "PROJECT_STATE.md",
  );
  if (!state) return { ...EMPTY_SUMMARY, counts: { ...EMPTY_SUMMARY.counts } };

  const statePath = rootId === "" ? "PROJECT_STATE.md" : `${rootId}/PROJECT_STATE.md`;
  const text = await source.readText(statePath);
  const parsed = parseDocument("PROJECT_STATE.md", text);
  const markdown = await listProjectMarkdown(source, rootId);
  const modules = mergeModules(moduleInfosFromPaths(markdown), text);
  const activeNumber = activeModuleNumberFromBlocks(parsed.blocks);
  const closable = modules
    .filter((module) => module.number !== 0)
    .map((module) => ({ stateKey: mapStatus(module.state ?? "—").key }));
  const stats = summarizeStates(closable);
  const active = modules.find((module) => module.number === activeNumber);

  return {
    counts: stats.counts,
    progress: stats.progress,
    activeModule: active?.name ?? null,
    lastUpdate: parsed.meta.lastUpdate,
  };
}

/**
 * Summary of a project that is already built. It uses the dashboard rules so a
 * card reloaded from the project view agrees with its dashboard.
 */
export function summaryFromProject(project: Project): ProjectSummary {
  const dashboard = dashboardSummary(project);
  const state = project.documents.find((document) => document.category === "state");
  const active = dashboard.modules.find((module) => module.active);
  return {
    counts: dashboard.counts,
    progress: dashboard.progress,
    activeModule: active?.name ?? null,
    lastUpdate: state?.meta.lastUpdate ?? null,
  };
}
