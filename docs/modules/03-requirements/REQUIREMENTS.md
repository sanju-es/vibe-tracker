# Module 3 — REQUIREMENTS

> **Purpose:** functional requirements, rules and acceptance of the requirements catalogue.
> **Read when:** verifying behaviour, judging a change or reopening the module.
> **Canonical for:** `FR-NN`, `BR-NN` and `VAL-NN` of this module.
> **Do not duplicate:** scope (`MODULE.md` §2) and implementation (`TECHNICAL.md`).

**Status:** `Tested` (2026-11-16)
**Last update:** 2026-11-16

---

## 1. Goal

Review the agreed behaviour of the whole project in one catalogue: functional requirements, business rules, flows, validations and edge cases, grouped by module and section.

## 2. Functional requirements

### FR-1 — Catalogue entry and home

The top banner offers *Requirements* next to *Backlog* and *Home*. *Requirements* opens the catalogue in the main area; *Home* returns to `PROJECT_STATE.md`.

### FR-2 — Every module requirements document

The catalogue reads every module `REQUIREMENTS.md` found in the project and lists its functional requirements, business rules, flows, validations and edge cases. A module without entries stays visible with an explicit `No requirements recorded` row; a module in `Pending` state is never hidden.

### FR-3 — Catalogue table and filters

The table shows `Module`, `State`, `Section`, `ID` and `Text`. A text filter searches every cell, and the status chips filter by module state. Every module state is visible when the catalogue opens.

### FR-4 — Grouping and sorting

A selector groups the catalogue by `None`, `Module` or `Section`. Rows can be sorted by one column at a time, and the order applies inside each group. Sections follow the requirements order: functional requirements, business rules, flows, validations and edge cases.

### FR-5 — Row detail and source

Opening a row shows the shared detail modal with the item text. *Go to document* opens the source `REQUIREMENTS.md` at the defining heading or section. The catalogue never writes to the project.

### FR-6 — Empty and no-results states

When the project has no module requirements documents the catalogue shows an explicit empty state. When the filters exclude every row it shows the shared no-results message and keeps the controls available.

## 3. Business rules

- **BR-1 — Read-only.** The catalogue shows the documented requirements and never edits, adds or deletes them.
- **BR-2 — Documents are the source of truth.** A row exists only when the source document defines it; missing sections stay absent and no requirement is invented.
- **BR-3 — Module state only.** The status filter uses the state of the owning module. The catalogue does not invent a per-requirement state or mix in acceptance evidence; that belongs to a traceability view.
- **BR-4 — Stable identifiers.** `FR-NN`, `BR-NN` and `VAL-NN` keep the identifier of the source; flows and edge cases have no identifier and show `—`.
- **BR-5 — One full view, no duplicate.** The reader still renders each `REQUIREMENTS.md`; the catalogue is the cross-module view. Global search stays in module 5.

## 4. Flows

1. **Open the catalogue.** Press *Requirements* in the top banner → every module requirements item is listed.
2. **Narrow the list.** Type in the text filter → toggle module state chips → the table updates without touching the documents.
3. **Group and sort.** Choose `Module` or `Section` → sort a column → rows stay inside their group.
4. **Read the source.** Click a row → read the item in the modal → *Go to document* → the source `REQUIREMENTS.md` opens at the defining heading or section.
5. **Return home.** Press *Home* → `PROJECT_STATE.md` opens with the default navigation state.

## 5. Validations

- **VAL-1** — Module without `REQUIREMENTS.md`: contributes no rows and raises no error.
- **VAL-2** — Module with `REQUIREMENTS.md` but no recorded items: one explicit `No requirements recorded` row for that module.
- **VAL-3** — Missing section: no row is invented for it.
- **VAL-4** — Unknown module state literal: shown literally, filterable, never mapped to a known state.
- **VAL-5** — The project has no requirements rows: explicit empty state.
- **VAL-6** — Filters exclude every row: shared no-results message.
- **VAL-7** — The same `FR-N` exists in several modules: allowed; the `Module` column and the source target keep them distinct.

## 6. Edge cases

- A `Pending` module with `_not recorded._` sections: the catalogue shows the explicit no-requirements row instead of hiding the module.
- A functional requirement with several body paragraphs: the row text keeps the whole requirement and the modal shows it in full.
- A flow or edge-case list item without an identifier: `ID` shows `—` and the source target still opens the section.
- Repeated column names or missing sections: no value is guessed.
- Reload while the catalogue is open: it recomputes from the new project and keeps the view when the project still has documents.
- A very large catalogue: no pagination in this module; the shared table filters, truncation and row detail keep it usable.

## 8. Dependencies

- **Depends on:** module 1 (Structured Reader) for the reading workspace, top-banner shell and the shared table component.
- **Shared code:** module 0 for folder access, scanning, the semantic model and the Markdown extractors.

## 9. Acceptance criteria

| FR | Criterion | Evidence | Status |
|---|---|---|---|
| FR-1 | *Requirements* opens the catalogue and *Home* returns to `PROJECT_STATE.md`. | Manual browser check | verified (2026-11-16) |
| FR-2 | Every `REQUIREMENTS.md` contributes its items and a module without entries stays visible. | `tests/requirements.test.ts`, manual browser check | verified (2026-11-16) |
| FR-3 | The table shows module, state, section, id and text, with text and state filters. | `tests/requirements.test.ts`, `tests/tables.test.ts`, manual browser check | verified (2026-11-16) |
| FR-4 | Grouping switches `None` / `Module` / `Section` and sorting stays inside each group. | `tests/tables.test.ts`, manual browser check | verified (2026-11-16) |
| FR-5 | A row opens the detail modal and *Go to document* reaches the source item. | `tests/requirements.test.ts`, manual browser check | verified (2026-11-16) |
| FR-6 | The catalogue shows explicit empty and no-results states. | `tests/requirements.test.ts`, manual browser check | verified (2026-11-16) |
