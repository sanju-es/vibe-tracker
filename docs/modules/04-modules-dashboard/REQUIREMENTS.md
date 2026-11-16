# Module 4 — REQUIREMENTS

> **Purpose:** functional requirements, rules and acceptance of the modules dashboard.
> **Read when:** verifying behaviour, judging a change or reopening the module.
> **Canonical for:** `FR-NN`, `BR-NN` and `VAL-NN` of this module.
> **Do not duplicate:** scope (`MODULE.md` §2) and implementation (`TECHNICAL.md`).

**Status:** `Tested` (2026-11-16)
**Last update:** 2026-11-16

---

## 1. Goal

See the state of the whole project on one surface: modules, their states, documented progress and the dated history of each module.

## 2. Functional requirements

### FR-1 — Dashboard entry and home

The top banner offers *Dashboard* next to *Requirements*, *Backlog* and *Home*. *Dashboard* opens the project-health view in the main area; *Home* returns to `PROJECT_STATE.md`.

### FR-2 — Roadmap summary

The dashboard reads the module inventory and states documented in `PROJECT_STATE.md` and shows a summary card for total closable modules, `Tested`, in progress and `Pending`, plus counts for `Implemented`, `Blocked` and other states when they are not zero. Core is shown separately as `Active (permanent)` and is not part of the closable total.

### FR-3 — Documented progress

A counter and a progress bar show how many closable modules are `Tested` against the total. The value comes only from the documented module states; the dashboard never infers progress from code, dates or backlog rows.

### FR-4 — Module table

A compact table lists every module with its folder, name, state, last update and whether it is the active module. Rows are ordered by module number. Core keeps its permanent entry outside the progress counter.

### FR-5 — Changelog timeline

A timeline lists the dated entries of every module `CHANGELOG.md`, newest first, with the module, date and entry title. A module filter narrows the list. Selecting an entry opens the shared detail modal and *Go to document* reaches that entry in the source changelog.

### FR-6 — Empty and edge states

When the project has no modules the dashboard shows an explicit empty state. When no dated changelog entry exists the timeline shows an explicit empty message. Unknown state literals and a missing active module are shown literally, never mapped or guessed.

## 3. Business rules

- **BR-1 — Read-only.** The dashboard never changes a module state, a changelog or any document.
- **BR-2 — Documented state only.** Every count, bar and status comes from `PROJECT_STATE.md` and the module files; no progress is inferred from code or dates.
- **BR-3 — Core is permanent.** Module 0 is shown separately and excluded from the closable total and the progress bar.
- **BR-4 — Timeline is source text.** Only changelog headings with a `YYYY-MM-DD` date become entries; a heading without a date is skipped.
- **BR-5 — One view, no duplicate.** The Modules overview of module 1 keeps document navigation and backlog counts; this dashboard adds the project-level summary and history. Backlog, requirements and global search stay in their modules.

## 4. Flows

1. **Open the dashboard.** Press *Dashboard* in the top banner → the roadmap summary and timeline load from the scanned project.
2. **Read the roadmap.** See the documented counts, the `Tested` progress bar, the module table and the active module.
3. **Filter the timeline.** Choose a module in the filter → only its dated entries remain.
4. **Open an entry.** Click a timeline entry → read its detail → *Go to document* opens the source changelog at that entry.
5. **Return home.** Press *Home* → `PROJECT_STATE.md` opens with the default navigation state.

## 5. Validations

- **VAL-1** — Module without a `CHANGELOG.md`: contributes no timeline entries and raises no error.
- **VAL-2** — Changelog heading without a valid date: skipped; no entry is invented.
- **VAL-3** — Missing or `none` active module line: no row is marked active.
- **VAL-4** — Unknown module state literal: shown literally and counted in the total, never mapped to a known state.
- **VAL-5** — Project without modules: explicit empty dashboard.
- **VAL-6** — No dated changelog entries: explicit empty timeline.
- **VAL-7** — Module without `MODULE.md`: state comes from the inventory and last update shows `—`.

## 6. Edge cases

- Core only: the dashboard still shows the permanent Core row and zero closable modules; progress is `0 of 0` with an explicit message.
- Several entries share a date: all are kept and ordered by module number.
- The active module line names a module that is not in the inventory: no row is marked active.
- A module state changes on disk: reload rebuilds the dashboard from the new project.
- A very long changelog: no pagination; the module filter and the timeline order keep it reviewable.

## 8. Dependencies

- **Depends on:** module 1 (Structured Reader) for the reading workspace, top-banner shell and the shared row-detail modal.
- **Shared code:** module 0 for folder access, scanning and the semantic model.

## 9. Acceptance criteria

| FR | Criterion | Evidence | Status |
|---|---|---|---|
| FR-1 | *Dashboard* opens the view and *Home* returns to `PROJECT_STATE.md`. | Manual browser check | verified (2026-11-16) |
| FR-2 | The summary counts documented states and shows Core separately. | `tests/dashboard.test.ts`, manual browser check | verified (2026-11-16) |
| FR-3 | The progress counter and bar use only documented module states. | `tests/dashboard.test.ts` | verified (2026-11-16) |
| FR-4 | The module table lists folder, name, state, last update and the active module. | `tests/dashboard.test.ts`, manual browser check | verified (2026-11-16) |
| FR-5 | The timeline lists dated entries newest first, filters by module and reaches the source. | `tests/dashboard.test.ts`, manual browser check | verified (2026-11-16) |
| FR-6 | Empty project, empty timeline and unknown states are explicit. | `tests/dashboard.test.ts`, manual browser check | verified (2026-11-16) |
