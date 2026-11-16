# Module 4 — TECHNICAL

> **Purpose:** design, surface, data, implementation, tests and limits of the modules dashboard.
> **Read when:** changing the module or reviewing its technical constraints.
> **Canonical for:** components, data, tests and limits of this module.
> **Do not duplicate:** requirements (`REQUIREMENTS.md`) and shared architecture (`docs/ARCHITECTURE.md`).

**Status:** `Implemented` (2026-11-16)
**Last update:** 2026-11-16

---

## 1. Design and principles

- **Documented state only.** The dashboard reads the inventory, module files and changelog headings; it never infers progress from code or dates (04 BR-2).
- **Project level, not navigation.** Module 1 keeps the document-level Modules overview and backlog counts; this view answers how the whole roadmap is doing.
- **Core is permanent.** Module 0 has its own row and stays outside the closable total and progress bar (04 BR-3).
- **One timeline.** Dated changelog headings from every module are merged newest first and kept read-only.

## 2. Surface

No endpoints: the project has no own API. The proposal adds:

| Surface | Responsibility |
|---|---|
| `views/modules-dashboard.svelte` | Summary cards, progress bar, module table, timeline and module filter |
| `lib/model/dashboard.ts` | `dashboardSummary(project)` with modules, counts, progress and timeline |
| `stores/navigation.svelte.ts` | `dashboard` active view and `openDashboard()` |
| `views/reading-workspace.svelte` | *Dashboard* action in the top banner and dashboard branch |

## 3. Data

`dashboardSummary(project)` returns:

- `modules`: one entry per module with number, folder, name, documented state, status key, last update, active flag. Last update comes from the module `MODULE.md` front block; the active flag comes from the `Active module:` line in `PROJECT_STATE.md`.
- `core`: module 0 separately with `Active (permanent)` and its permanent row.
- `counts`: closable modules per state (`Tested`, in progress, `Pending`, `Blocked`, other), the closable total and the `Tested` count.
- `progress`: `tested / closable` as a fraction and a percentage; `0 of 0` when there are no closable modules.
- `timeline`: `{ date, moduleNumber, moduleFolder, title, documentId, anchor }` for every `## YYYY-MM-DD — Title` changelog heading, newest first; entries without a date are skipped.

The active module parser reads the state document text from its nodes: a line `Active module:` followed by `none` or `NN`. A missing line or `none` leaves every row inactive.

## 4. Implementation

- `lib/model/dashboard.ts` walks `project.modules` and the documents of each module: `MODULE.md` for the front-block last update, `CHANGELOG.md` for the timeline, and the `PROJECT_STATE.md` nodes for the active module. It uses `moduleFolderName`, `runsText` and `mapStatus`; no Core model change is needed.
- Timeline headings are parsed from the parsed nodes, so no second Markdown pass is needed; the anchor is the heading anchor and the target is an `ItemTarget`.
- The dashboard view renders the Core row, summary cards, progress bar, a compact module table with a state chip and an active marker, and the timeline with a module `<select>`.
- Selecting a timeline entry calls `reader.openRow([target])`; the existing modal handles the item and *Go to document*.
- `navigation.svelte.ts` gains the `dashboard` view and `openDashboard()`; `reading-workspace.svelte` gains the banner action and the view branch.
- i18n: dashboard title, banner action, card labels, progress label, table headers, timeline labels, empty states and an icon fallback.

**Impact on module 1.** The top banner gains one action and the workspace gains one branch; the reader's table, document and navigation behaviour are unchanged.

## 5. Interaction and behaviour

**Roadmap.** The dashboard opens on the documented states: Core is a separate permanent row; the cards and bar summarise the closable modules; the table lists folder, name, state, last update and the active marker.

**Timeline.** Entries are newest first. The module filter narrows them to one module; selecting one opens the shared modal and *Go to document* jumps to the heading in the source `CHANGELOG.md`.

**Empty states.** No modules shows an explicit empty dashboard; no dated entries shows an explicit empty timeline; `0 of 0` closable modules is stated instead of a division.

## 6. Tests and evidence

- `tests/dashboard.test.ts`: counts by state, Core separation, progress fraction and percentage, active module parsing (including `none` and missing), module table data, timeline ordering, dated filtering and skipped undated headings.
- `npm run test` on 2026-11-16: 132 tests across 14 suites, all green.
- `npm run check`, `npm run lint`, `npm run docs:check` and `npm run build` on 2026-11-16: all green; `dist/index.html` is 213.59 kB.
- Browser check in Edge: banner action, cards, progress bar, table, timeline filter and source jump remain for the owner's verification.

## 7. Limits and known limitations

- The progress bar counts documented module states, not effort, story points or code completion.
- The timeline covers changelog headings with a date; free prose inside an entry is not a separate record.
- No pagination: a very large changelog renders every dated entry.
- The dashboard is read-only and keeps no view state between sessions.
- Module state and last update come from the documented files; missing values are shown literally.
