# Module 2 — REQUIREMENTS

> **Purpose:** functional requirements, rules and acceptance of the backlog board module.
> **Read when:** verifying behaviour, judging a change or reopening the module.
> **Canonical for:** `FR-NN`, `BR-NN` and `VAL-NN` of this module.
> **Do not duplicate:** scope (`MODULE.md` §2) and implementation (`TECHNICAL.md`).

**Status:** `Tested` (2026-11-16)
**Last update:** 2026-11-16

---

## 1. Goal

Review the pending work of the whole project in one board, grouped by module and status, and jump to the source row.

## 2. Functional requirements

### FR-1 — Board entry and home

The top banner offers _Backlog_ and _Home_. _Backlog_ opens the board in the main area; _Home_ returns to `PROJECT_STATE.md` and the default navigation state.

### FR-2 — Every backlog item

The board reads every module `BACKLOG.md` found in the project, including `00-core`; every table with a `Status` column contributes one row per item with its module. No status is excluded by default.

### FR-3 — Board table and filters

The table shows `Module`, `ID`, `Date`, `Type`, `Description`, `Origin`, `Priority` and `Status`. A text filter searches every cell and the status chips filter by the status vocabulary; all statuses are visible when the board opens.

### FR-4 — Grouping and sorting

A selector groups the table by `None`, `Module` or `Status`. Rows can be sorted by one column at a time, and the order applies inside each group. Grouping and sorting change the view, not the data.

### FR-5 — Row detail and source

Opening a row shows the shared detail modal. _Go to document_ navigates to the source `BACKLOG.md` and highlights the source row. The board never writes to the project.

### FR-6 — Empty and no-results states

When the project has no backlog items the board shows an explicit empty state. When the filters exclude every row it shows the shared no-results message and keeps the controls available.

## 3. Business rules

- **BR-1 — Read-only.** The board shows the documented state and never changes, creates or deletes a backlog item.
- **BR-2 — Documents are the source of truth.** A row exists only when a `BACKLOG.md` table defines it; a missing column stays empty and no value is invented.
- **BR-3 — One full view, one summary.** The Modules overview keeps its compact `01 FR-22` summary; the board is the complete cross-module view. Global search across all documents belongs to module 5.
- **BR-4 — View state only.** Grouping, text, status and sort are session state; nothing is persisted (D-18).
- **BR-5 — Core is included.** `00-core/BACKLOG.md` contributes its `CORE-NN` rows like any other module; a module without a backlog contributes nothing.

## 4. Flows

1. **Open the board.** Press _Backlog_ in the top banner → the board lists every backlog row.
2. **Narrow the list.** Type in the text filter → toggle status chips → the table updates without changing the source documents.
3. **Group and sort.** Choose `Module` or `Status` → sort a column → rows stay inside their group.
4. **Open an item.** Click a row → read the detail modal → _Go to document_ → the source `BACKLOG.md` opens with the row highlighted.
5. **Return home.** Press _Home_ → `PROJECT_STATE.md` opens with the default navigation state.

## 5. Validations

- **VAL-1** — Module without `BACKLOG.md`: contributes no rows and raises no error.
- **VAL-2** — Backlog table without a `Status` column: contributes no rows, because it is not a registered backlog table.
- **VAL-3** — Missing registered column in a row: the cell stays empty; no value is guessed.
- **VAL-4** — Unknown status literal: shown literally and filterable, never mapped to a known state.
- **VAL-5** — The project has no backlog rows: explicit empty state.
- **VAL-6** — Filters exclude every row: shared no-results message.
- **VAL-7** — The same `B-NN` exists in several modules: allowed; the `Module` column and the source target keep them distinct.

## 6. Edge cases

- `00-core` has only implemented items: the board still lists them; status filters can hide them.
- A module with several tables in `BACKLOG.md`: every table with a status column contributes rows.
- Repeated column names: the first matching registered column is used.
- Reload while the board is open: the board recomputes from the new project and keeps the view when the project still has documents.
- A very large board: no pagination in this module; the shared table controls and row detail keep it usable.
- Selecting a document in the sidebar leaves the board and opens the document.

## 8. Dependencies

- **Depends on:** module 1 (Structured Reader) for the reading workspace, top-banner shell and the shared table component.
- **Shared code:** module 0 for folder access, scanning, the semantic model and the table semantics.

## 9. Acceptance criteria

| FR   | Criterion                                                                                         | Evidence                                        | Status          |
| ---- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------- |
| FR-1 | _Backlog_ opens the board and _Home_ returns to `PROJECT_STATE.md`.                               | Manual browser check                            | verified (2026-11-16) |
| FR-2 | Every backlog row, including `00-core`, appears with its module and status.                       | `tests/selectors.test.ts`                       | verified (2026-11-16) |
| FR-3 | The board shows the registered columns, a text filter and status chips with every status visible. | `tests/tables.test.ts`, manual browser check    | verified (2026-11-16) |
| FR-4 | The group selector switches `None` / `Module` / `Status` and sorting stays inside each group.     | `tests/tables.test.ts`, manual browser check    | verified (2026-11-16) |
| FR-5 | A row opens the detail modal and _Go to document_ highlights the source row.                      | `tests/selectors.test.ts`, manual browser check | verified (2026-11-16) |
| FR-6 | The board shows explicit empty and no-results states.                                             | `tests/tables.test.ts`, manual browser check    | verified (2026-11-16) |
