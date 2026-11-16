# Module 2 — CHANGELOG

> Dated history only. No state, pending work or duplicated implementation logs.
**History:** append-only.

## 2026-11-16 — Closure as Tested

- The owner verified the board in Edge and the module moves from `Implemented` to `Tested`; every acceptance row in `REQUIREMENTS.md` §9 is `verified (2026-11-16)`.
- Delivered: top-banner Backlog/Home, full board from every `BACKLOG.md` including `00-core`, all statuses with optional filters, `None`/`Module`/`Status` grouping, sorting inside groups, row detail and source jump. No code changed in this entry.

## 2026-11-16 — Backlog board implemented

- The top banner gains *Backlog* and *Home*; the board opens in the main area and *Home* returns to `PROJECT_STATE.md`.
- `backlogBoard` builds the full synthetic table from every `BACKLOG.md`, including `00-core`, with all statuses and a source target per row.
- `groupRows` adds `None` / `Module` / `Status` grouping with filtering first and sorting inside each group; `DataTable` accepts an optional `groupBy` without changing its default path.
- `npm run test` 119 tests across 12 suites; `check`, `lint`, `docs:check` and `build` green. The Edge check remains for the owner's verification.

## 2026-11-16 — Implementation proposal written

- Requirements and technical proposal recorded: top-banner entry and home, complete board from every `BACKLOG.md`, all statuses with optional filters, `None`/`Module`/`Status` grouping, shared row detail and source jump.
- The Modules summary (`01 FR-22`) stays; global search stays in module 5. No code changed; the module waits for approval.

## 2026-11-16 — Analysis decisions

- The board opens from the top banner, next to a home action that returns to `PROJECT_STATE.md`.
- All backlog items are shown, including `00-core`; no status is excluded by default, and text/status filters are optional.
- Grouping uses a `None` / `Module` / `Status` selector; rows open the existing detail and *Go to document* highlights the source row.
- The Modules overview keeps the compact `01 FR-22` summary; global search stays in module 5.

## 2026-11-16 — Analysis started

- The owner selected module 2; the module moves from `Pending` to `In analysis`.
- Open decisions: board placement in navigation, grouping, default status filter and the relationship with the module 1 aggregated table (`01 FR-22`). No code changed.

## 2026-11-13 — Documentation audit

- The dependency block left `MODULE.md` §10: `REQUIREMENTS.md` §8 is its only home (AG-03, standard v1.1).

## 2026-11-13

- Module documentation created with status `Pending`.
- Analysis pending; no code change yet.
- Documentation standard, phase 4 (D-26): front block, canonical slots and the registered backlog table; no analysis or behaviour was added.
