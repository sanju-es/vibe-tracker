# Module 2 — TECHNICAL

> **Purpose:** design, surface, data, implementation, tests and limits of the backlog board module.
> **Read when:** changing the module or reviewing its technical constraints.
> **Canonical for:** components, data, tests and limits of this module.
> **Do not duplicate:** requirements (`REQUIREMENTS.md`) and shared architecture (`docs/ARCHITECTURE.md`).

**Status:** `Tested` (2026-11-16)
**Last update:** 2026-11-16

---

## 1. Design and principles

- **One full view, one summary.** The board is the complete cross-module backlog; the compact `01 FR-22` table in Modules stays as a preview (BR-3).
- **Synthetic table, real targets.** Rows are cloned from the module backlog tables and every row keeps a `RowTarget` to its source row, so the detail modal and _Go to document_ keep working.
- **View, not data.** Text, status, group and sort are table view state; the project model is never modified.
- **Reuse the shell.** The board lives in the existing reading workspace, uses the shared table component and the existing row-detail modal.

## 2. Surface

No endpoints: the project has no own API. The proposal adds:

| Surface                              | Responsibility                                                                           |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| Board view under `src/views/`        | Header, grouping selector and shared table                                               |
| `components/nodes/data-table.svelte` | Optional `groupBy` prop; group header rows and grouping-aware sorting                    |
| `stores/navigation.svelte.ts`        | `backlog` active view and `openBacklog()`; `Home` uses the existing `reset()`            |
| `views/reading-workspace.svelte`     | _Home_ and _Backlog_ actions in the top banner; renders the board for the `backlog` view |
| `app/App.svelte`                     | Chooses the workspace, scan, error or empty state (unchanged)                            |
| `lib/model/selectors.ts`             | `backlogBoard(project)` and shared synthetic-table builder                               |
| `lib/semantics/tables.ts`            | Pure grouping helper used by the table                                                   |

## 3. Data

- `BacklogBoard` is a synthetic `Table` plus `Map<string, RowTarget>`: headers `Module`, `ID`, `Date`, `Type`, `Description`, `Origin`, `Priority`, `Status`; `statusColumn` is the last one.
- A shared builder reads every module, every table of its `BACKLOG.md`, keeps the rows with a status column and maps the registered columns by header name. Missing columns stay empty.
- `backlogBoard(project)` keeps every status and includes `00-core`; `backlogSummary(project)` keeps the existing `new`/`in progress` filter for module 1.
- Grouping is computed from the filtered rows: the group key is the `Module` cell (column 0) or the normalized status key of the `Status` cell, so dated literals such as `implemented (YYYY-MM-DD)` share one group. Group order is module number or status rank, and rows keep the selected sort inside the group.
- No persistence: group, text, status and sort reset with the session (D-18).

## 4. Implementation

- `selectors.ts`: extract the synthetic-table builder behind `backlogSummary`; add `backlogBoard` with its own table id. Both keep a `targets` map from synthetic row id to the source `RowTarget`.
- `lib/semantics/tables.ts`: add `groupRows(table, view, column)` that filters first, groups, orders the groups (module label or status rank) and sorts inside each group. `applyView` stays unchanged for module 1.
- `data-table.svelte`: add the optional `groupBy` prop. The default path is the current single table; with grouping, the single `<tbody>` gains a group-header row before each group and reuses the same row markup through a snippet. The filter bar stays single and global.
- `navigation.svelte.ts`: add `"backlog"` to `ActiveView` and `openBacklog()`; `Home` calls the existing `reset(project)`, which selects `PROJECT_STATE.md`.
- `reading-workspace.svelte`: add _Home_ and _Backlog_ buttons with icon, accessible label and current state; the rest of the shell is unchanged.
- `App.svelte`: add the `backlog` branch; the sidebar stays visible.
- The new board view under `src/views/`: derive `backlogBoard(project)`, hold the group selector (`none`/`module`/`status`) and pass `groupBy` to `DataTable`.
- i18n: add the board title, actions, grouping labels, empty state and icon fallbacks.

**Impact on module 1.** The top banner and `DataTable` are owned by module 1, which is `Tested`. Both changes are additive: `groupBy` is optional and the default table path is unchanged; the banner gains two actions. The implementation keeps the module 1 regression suites green and records the impact in its changelog. No behaviour of the reader changes.

## 5. Interaction and behaviour

**Opening the board.** _Backlog_ in the top banner switches the main area to the
board and marks the action as current; the sidebar stays available. _Home_ returns
to `PROJECT_STATE.md` and the default navigation state.

**Filters and grouping.** The shared filter bar searches every cell and toggles
status chips; the initial view has no status restriction. The group selector
switches between a flat table, module groups and status groups. Group headers show
the value and the number of rows; sorting applies inside each group.

**Row detail.** A click or `Enter` on a row opens the shared modal with the source
row; _Go to document_ closes it, opens the source `BACKLOG.md` and highlights the
row. Group header rows are not interactive.

## 6. Tests and evidence

- `tests/selectors.test.ts`: `backlogBoard` includes every status and `00-core`; `backlogSummary` still filters `new`/`in progress`; synthetic row targets point at the source row.
- `tests/tables.test.ts`: grouping by module and status, group order, filtering before grouping, sorting inside a group and no mutation of the source rows.
- `npm run test` on 2026-11-16: 141 tests across 15 suites, all green.
- `npm run check`, `npm run lint`, `npm run docs:check` and `npm run build` on 2026-11-16: all green; `dist/index.html` is 222.89 kB.
- Owner verification (2026-11-16): the board was accepted and closed as `Tested`; every acceptance row in [`REQUIREMENTS.md`](REQUIREMENTS.md) §9 is `verified (2026-11-16)`. The browser check covered the banner actions, filters, grouping, row detail and _Go to document_.

## 7. Limits and known limitations

- Single-column sorting, as in the rest of the application (D-14); multi-column sorting stays `01 B-01`.
- The board has no global document search; that belongs to module 5.
- No pagination: a very large project renders every backlog row, like the other tables.
- The board is read-only and keeps no view state between sessions.
- The top banner and `DataTable` are shared with module 1; the additive change is verified with its regression suites.
