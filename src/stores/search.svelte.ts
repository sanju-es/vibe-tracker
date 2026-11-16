class SearchStore {
  query = $state("");
  /** Increments when the view should focus its input. */
  focusRequest = $state(0);

  focus(): void {
    this.focusRequest += 1;
  }

  clear(): void {
    this.query = "";
    this.focus();
  }
}

export const search = new SearchStore();
