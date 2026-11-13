import type {
  Cell,
  Document,
  ModuleInfo,
  Project,
  Row,
  RowTarget,
  StatusKey,
  Table,
} from "./types";
import { mapStatus, statusRank } from "../semantics/status";
import { moduleFolderName } from "./categories";

export function moduleByNumber(project: Project, number: number): ModuleInfo | null {
  return project.modules.find((module) => module.number === number) ?? null;
}

export function moduleDocuments(project: Project, number: number): Document[] {
  return project.documents.filter((document) => document.moduleNumber === number);
}

export interface ModuleBacklog {
  document: Document;
  tables: Table[];
}

/** The module's backlog document and its tables, or null when it has none. */
export function moduleBacklog(project: Project, number: number): ModuleBacklog | null {
  const document =
    project.documents.find(
      (entry) => entry.moduleNumber === number && entry.category === "backlog",
    ) ?? null;
  if (!document) return null;
  return { document, tables: document.tables };
}

export interface BacklogCounts {
  all: number;
  /** Entries per known backlog status; absent keys mean zero. */
  byStatus: Partial<Record<StatusKey, number>>;
}

/**
 * Backlog status keys used by any module, in vocabulary order. The overview
 * shows one count column per key; unknown literals have no key and are only
 * counted in `all`.
 */
export function backlogStatusKeys(project: Project): StatusKey[] {
  const found = new Set<StatusKey>();

  for (const module of project.modules) {
    const backlog = moduleBacklog(project, module.number);
    if (!backlog) continue;
    for (const table of backlog.tables) {
      if (table.statusColumn === null) continue;
      for (const row of table.rows) {
        const key = mapStatus(row.cells[table.statusColumn]?.text ?? "").key;
        if (key !== null) found.add(key);
      }
    }
  }

  return [...found].sort((a, b) => statusRank(keyStatus(a)) - statusRank(keyStatus(b)));
}

function keyStatus(key: StatusKey): { value: string; key: StatusKey } {
  return { value: key, key };
}

/** Backlog totals of a module: all entries and the count per status key. */
export function moduleBacklogCounts(project: Project, number: number): BacklogCounts {
  const counts: BacklogCounts = { all: 0, byStatus: {} };
  const backlog = moduleBacklog(project, number);
  if (!backlog) return counts;

  for (const table of backlog.tables) {
    for (const row of table.rows) {
      counts.all += 1;
      const column = table.statusColumn;
      const key = column === null ? null : mapStatus(row.cells[column]?.text ?? "").key;
      if (key === null) continue;
      counts.byStatus[key] = (counts.byStatus[key] ?? 0) + 1;
    }
  }
  return counts;
}

export interface BacklogSummary {
  table: Table;
  targets: Map<string, RowTarget>;
}

const SUMMARY_HEADERS = [
  "Module",
  "ID",
  "Date",
  "Type",
  "Description",
  "Origin",
  "Priority",
  "Status",
];

/**
 * One filterable table with the backlog items of every module whose status is in
 * `statuses`. Each synthetic row keeps a target back to its source row.
 */
export function backlogSummary(
  project: Project,
  statuses: readonly StatusKey[] = ["new", "in-progress"],
): BacklogSummary {
  const tableId = "backlog-summary#table-1";
  const targets = new Map<string, RowTarget>();
  const rows: Row[] = [];
  const accepted = new Set<StatusKey>(statuses);

  for (const module of project.modules) {
    const backlog = moduleBacklog(project, module.number);
    if (!backlog) continue;
    const folder = moduleFolderName(module.number, module.slug, module.name);

    for (const source of backlog.tables) {
      const statusIndex = source.statusColumn;
      if (statusIndex === null) continue;
      const indexOf = (name: string): number => {
        const found = source.headers.findIndex(
          (header) => header.toLowerCase() === name.toLowerCase(),
        );
        return found === -1 ? -1 : found;
      };
      const idIndex = indexOf("ID");
      const dateIndex = indexOf("Date");
      const typeIndex = indexOf("Type");
      const descriptionIndex = indexOf("Description");
      const originIndex = indexOf("Origin");
      const priorityIndex = indexOf("Priority");

      for (const sourceRow of source.rows) {
        const key = mapStatus(sourceRow.cells[statusIndex]?.text ?? "").key;
        if (key === null || !accepted.has(key)) continue;

        const rowId = `${tableId}-r${rows.length + 1}`;
        const pick = (index: number): Cell => {
          const cell = index === -1 ? undefined : sourceRow.cells[index];
          return cell ?? { column: 0, text: "", runs: [], ref: null };
        };
        const moduleCell: Cell = {
          column: 0,
          text: folder,
          runs: [{ kind: "text", text: folder }],
          ref: null,
        };
        const cells: Cell[] = [
          moduleCell,
          { ...pick(idIndex), column: 1 },
          { ...pick(dateIndex), column: 2 },
          { ...pick(typeIndex), column: 3 },
          { ...pick(descriptionIndex), column: 4 },
          { ...pick(originIndex), column: 5 },
          { ...pick(priorityIndex), column: 6 },
          { ...pick(statusIndex), column: 7 },
        ];
        rows.push({ id: rowId, cells });
        targets.set(rowId, {
          kind: "row",
          documentId: backlog.document.id,
          documentTitle: backlog.document.title,
          moduleNumber: module.number,
          tableId: source.id,
          rowId: sourceRow.id,
          headers: source.headers,
          cells: sourceRow.cells,
        });
      }
    }
  }

  return {
    table: {
      id: tableId,
      headers: SUMMARY_HEADERS,
      rows,
      statusColumn: SUMMARY_HEADERS.indexOf("Status"),
    },
    targets,
  };
}
