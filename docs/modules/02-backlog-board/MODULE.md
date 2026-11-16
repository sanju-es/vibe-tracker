# Module 2 — Backlog Board

> **Purpose:** the backlog board module of the reader.
> **Read when:** planning, analysing or closing this module.
> **Canonical for:** its scope, decisions and next step.
> **Do not duplicate:** requirements (`REQUIREMENTS.md`), implementation (`TECHNICAL.md`) and history (`CHANGELOG.md`).

**Status:** `Tested` (2026-11-16)
**Last update:** 2026-11-16

---

## 1. Purpose

Aggregate the backlog that lives inside every module document into one board, so pending work across the whole project can be reviewed together instead of module by module.

The reader already filters and sorts a table where it appears; this module adds the cross-document view: everything pending, grouped by module and status.

## 2. Scope

### In scope

- Collect backlog rows from every module `BACKLOG.md` found in the project, including `00-core`.
- Open the board from a top-banner action; a second top-banner action returns to the default project view (`PROJECT_STATE.md`).
- Present all items in one table with global text and status filters and no status excluded by default.
- Group by module or by status with a selector, and sort by any column.
- Show the origin of each item and open its row detail; *Go to document* jumps to the source document with the row highlighted.
- Empty state when the project has no backlog items at all.

### Out of scope

- Per-table filtering and sorting inside a document: that belongs to the reader (module 1).
- Changing the status of an item or writing anything back to the Markdown files.
- Creating or deleting backlog items.
- Global text search across all documents (module 5).

## 3. Actors and screens

Single internal user, no accounts. The top banner offers *Home* and *Backlog*;
*Home* returns to `PROJECT_STATE.md` and *Backlog* opens the board in the main
area while the sidebar stays available. The board has a grouping selector, a text
search, status chips and the shared row-detail modal. *Go to document* leaves the
modal on the source `BACKLOG.md` with the row highlighted.

## 4. Domain model

The board is a view over the existing model: `Project`, its modules, each module
`BACKLOG.md`, the registered table, rows and cells, and the `RowTarget` of every
source row. Invariants: the board is read-only; every row has a source document
and row target; unknown statuses stay literal; grouping and filters change the
view, never the data; no backlog row is invented when a module has no
`BACKLOG.md`.

## 5. Delivered features

- Top-banner *Backlog* and *Home* actions.
- Full cross-module board with every `BACKLOG.md`, including `00-core`, and all statuses.
- Text and status filters, `None` / `Module` / `Status` grouping and sorting inside groups.
- Shared row detail and *Go to document* with the source row highlighted.
- The Modules overview keeps its compact `01 FR-22` summary.

## 6. Documentation map

- [REQUIREMENTS.md](REQUIREMENTS.md): functional requirements, rules and acceptance.
- [TECHNICAL.md](TECHNICAL.md): design, surface, data, implementation, tests and limits.
- [CHANGELOG.md](CHANGELOG.md): dated history.
- [BACKLOG.md](BACKLOG.md): corrections and future work (only when reopening).

## 7. Decisions

| Decision | Gloss |
|---|---|
| D-13 | Module 2 is the aggregated backlog board across modules. |
| D-31 | The board opens from the top banner, includes every backlog and keeps the Modules summary. |

## 9. Next step

Closed as `Tested` on 2026-11-16 after the owner's verification. Module 3 —
Requirements is implemented and awaits the owner's verification.

## 10. Module-specific notes

### Open points

- The board is read-only: it shows the documented state and never replaces the document as the source of truth.
- Placement: a top-banner action opens the board and a second one returns to the default project view (owner, 2026-11-16).
- Columns: the registered backlog columns plus `Module`; single-column sort.
- Grouping: selector `None` / `Module` / `Status` (owner, 2026-11-16).
- Default status filter: none; all statuses visible and filters are optional (owner, 2026-11-16).
- Row action: row detail, then *Go to document* highlights the source row (owner, 2026-11-16).
- Scope: every `BACKLOG.md`, including `00-core` (owner, 2026-11-16).
- The Modules overview keeps the compact `01 FR-22` summary; the board is the full view (owner, 2026-11-16).
- Global search across all Markdown documents stays in module 5; this module searches only board rows (owner, 2026-11-16).
