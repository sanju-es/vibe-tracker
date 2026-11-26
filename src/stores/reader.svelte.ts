import type { RefTarget } from "../lib/model/types";

export type ReaderModal =
  | { kind: "row"; targets: RefTarget[]; identifier: string | null }
  | { kind: "document"; documentId: string }
  | { kind: "image"; path: string; alt: string };

class ReaderStore {
  modal = $state<ReaderModal | null>(null);
  highlightedRowId = $state<string | null>(null);

  #highlightTimer: ReturnType<typeof setTimeout> | null = null;

  openRow(targets: RefTarget[], identifier: string | null = null): void {
    if (targets.length === 0) return;
    this.modal = { kind: "row", targets, identifier };
  }

  openDocument(documentId: string): void {
    this.modal = { kind: "document", documentId };
  }

  openImage(path: string, alt: string): void {
    this.modal = { kind: "image", path, alt };
  }

  close(): void {
    this.modal = null;
  }

  highlight(rowId: string | null): void {
    this.highlightedRowId = rowId;
    if (this.#highlightTimer) clearTimeout(this.#highlightTimer);
    if (rowId === null) return;
    this.#highlightTimer = setTimeout(() => {
      this.highlightedRowId = null;
    }, 2400);
  }
}

export const reader = new ReaderStore();
