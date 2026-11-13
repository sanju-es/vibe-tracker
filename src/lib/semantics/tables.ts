import type { Row, StatusKey, Table } from "../model/types";
import { normalizeText } from "../format/text";
import { mapStatus, statusRank } from "./status";

export interface SortSpec {
  column: number;
  direction: "asc" | "desc";
}

export interface TableView {
  text: string;
  statuses: (StatusKey | null)[] | null;
  sort: SortSpec | null;
}

export const EMPTY_TABLE_VIEW: TableView = { text: "", statuses: null, sort: null };

const NUMERIC = /^-?\d+([.,]\d+)?$/;

function cellText(row: Row, column: number): string {
  return row.cells[column]?.text ?? "";
}

export function filterRows(table: Table, rows: readonly Row[], view: TableView): Row[] {
  const needle = normalizeText(view.text ?? "");
  const statuses = view.statuses;

  return rows.filter((row) => {
    if (needle !== "") {
      const haystack = row.cells.map((cell) => normalizeText(cell.text)).join(" ");
      if (!haystack.includes(needle)) return false;
    }
    if (statuses !== null) {
      const column = table.statusColumn;
      if (column === null) return false;
      const key = mapStatus(cellText(row, column)).key;
      if (!statuses.includes(key)) return false;
    }
    return true;
  });
}

function compareValues(
  a: string,
  b: string,
  statusColumn: number,
  column: number,
): number {
  const left = a.trim();
  const right = b.trim();
  if (left === "" && right === "") return 0;
  if (left === "") return 1;
  if (right === "") return -1;

  if (column === statusColumn) {
    const delta = statusRank(mapStatus(left)) - statusRank(mapStatus(right));
    if (delta !== 0) return delta;
  }

  if (NUMERIC.test(left) && NUMERIC.test(right)) {
    return Number(left.replace(",", ".")) - Number(right.replace(",", "."));
  }

  return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
}

export function sortRows(
  table: Table,
  rows: readonly Row[],
  sort: SortSpec | null,
): Row[] {
  if (!sort) return [...rows];
  const statusColumn = table.statusColumn ?? -1;
  const direction = sort.direction === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const left = cellText(a, sort.column).trim();
    const right = cellText(b, sort.column).trim();
    // Empty cells stay last in both directions.
    if (left === "" && right === "") return 0;
    if (left === "") return 1;
    if (right === "") return -1;
    return direction * compareValues(left, right, statusColumn, sort.column);
  });
}

/** Rows after applying filtering and sorting, in that order. */
export function applyView(table: Table, view: TableView): Row[] {
  return sortRows(table, filterRows(table, table.rows, view), view.sort);
}

export interface StatusOption {
  key: StatusKey | null;
  label: string;
  count: number;
}

/** Status values present in the table, with their counts. */
/** All status keys present in the table except the excluded ones. */
export function statusesExcluding(
  table: Table,
  excluded: readonly (StatusKey | null)[],
): (StatusKey | null)[] {
  const allowed = statusOptions(table)
    .map((option) => option.key)
    .filter((key) => key === null || !excluded.includes(key));
  return allowed.length > 0 ? allowed : [null];
}

export function statusOptions(table: Table): StatusOption[] {
  const column = table.statusColumn;
  if (column === null) return [];
  const counts = new Map<StatusKey | null, { label: string; count: number }>();
  for (const row of table.rows) {
    const raw = cellText(row, column);
    if (raw.trim() === "") continue;
    const status = mapStatus(raw);
    const current = counts.get(status.key);
    if (current) current.count += 1;
    else counts.set(status.key, { label: status.value, count: 1 });
  }
  return [...counts.entries()].map(([key, value]) => ({
    key,
    label: value.label,
    count: value.count,
  }));
}

export function toggleSort(view: TableView, column: number): TableView {
  if (view.sort && view.sort.column === column) {
    return {
      ...view,
      sort: { column, direction: view.sort.direction === "asc" ? "desc" : "asc" },
    };
  }
  return { ...view, sort: { column, direction: "asc" } };
}
