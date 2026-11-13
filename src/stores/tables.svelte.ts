import { EMPTY_TABLE_VIEW, toggleSort, type TableView } from "../lib/semantics/tables";
import type { StatusKey } from "../lib/model/types";

class TableStore {
  views = $state<Record<string, TableView>>({});

  view(tableId: string, fallback: TableView = EMPTY_TABLE_VIEW): TableView {
    return this.views[tableId] ?? fallback;
  }

  setText(tableId: string, text: string, fallback: TableView = EMPTY_TABLE_VIEW): void {
    this.views = { ...this.views, [tableId]: { ...this.view(tableId, fallback), text } };
  }

  toggleStatus(
    tableId: string,
    key: StatusKey | null,
    allKeys: (StatusKey | null)[],
    fallback: TableView = EMPTY_TABLE_VIEW,
  ): void {
    const view = this.view(tableId, fallback);
    const current = view.statuses ?? allKeys;
    const exists = current.includes(key);
    const statuses = exists ? current.filter((item) => item !== key) : [...current, key];
    this.views = {
      ...this.views,
      [tableId]: { ...view, statuses },
    };
  }

  sortBy(tableId: string, column: number, fallback: TableView = EMPTY_TABLE_VIEW): void {
    this.views = {
      ...this.views,
      [tableId]: toggleSort(this.view(tableId, fallback), column),
    };
  }

  reset(tableId: string): void {
    this.views = { ...this.views, [tableId]: EMPTY_TABLE_VIEW };
  }

  resetDocument(documentId: string): void {
    const prefix = `${documentId}#`;
    const next: Record<string, TableView> = {};
    for (const [key, value] of Object.entries(this.views)) {
      if (!key.startsWith(prefix)) next[key] = value;
    }
    this.views = next;
  }
}

export const tables = new TableStore();
