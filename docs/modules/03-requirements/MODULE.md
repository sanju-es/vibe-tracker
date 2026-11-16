# Module 3 — Requirements

> **Purpose:** the requirements module of the reader.
> **Read when:** planning, analysing or closing this module.
> **Canonical for:** its scope, decisions and next step.
> **Do not duplicate:** requirements (`REQUIREMENTS.md`), implementation (`TECHNICAL.md`) and history (`CHANGELOG.md`).

**Status:** `Tested` (2026-11-16)
**Last update:** 2026-11-16

---

## 1. Purpose

Aggregate the functional requirements, business rules, flows, validations and edge cases documented in every module into one readable catalogue, so the agreed behaviour of the whole project can be reviewed in one pass.

The reader shows each document as it is; this module adds the cross-module requirements catalogue.

## 2. Scope

### In scope

- Collect functional requirements, business rules, flows, validations and edge cases from every module `REQUIREMENTS.md` found in the project.
- Group them by module and by section type, with text and status filters.
- Show the identifier of each item and link it to its source document.
- Show a module in `Pending` state as such; never hide or fill it.
- Keep the module scope and invariants in `MODULE.md`; they are not duplicated in the catalogue.

### Out of scope

- Per-document rendering and table interaction: those belong to the reader (module 1).
- Editing requirements or adding new ones from the app.
- Backlog boards (module 2) and the modules dashboard (module 4).
- Global text search (module 5).

## 3. Actors and screens

Single internal user, no accounts. The top banner offers *Requirements* next to
*Backlog* and *Home*. *Requirements* opens the catalogue in the main area while
the sidebar stays available; the shared row-detail modal and *Go to document*
reach the source `REQUIREMENTS.md`.

## 4. Domain model

The catalogue is a view over the parsed model: each module requirements document
contributes `FR-NN` headings with their body, `BR-NN` and `VAL-NN` list items,
and the flow and edge-case list items. The module state is the status column.
Invariants: read-only; every row has an `ItemTarget` to its source; missing
sections are not invented; flows and edge cases have no identifier; a module
without recorded items keeps one explicit absence row.

## 5. Delivered features

- Top-banner *Requirements* action next to Backlog and Home.
- Catalogue of functional requirements, business rules, flows, validations and edge cases from every module.
- Module-state chips, text filter and `None` / `Module` / `Section` grouping with section order.
- Shared row detail and *Go to document* with the source heading or section.
- Explicit `No requirements recorded` rows for modules without items.

## 6. Documentation map

- [REQUIREMENTS.md](REQUIREMENTS.md): functional requirements, rules and acceptance.
- [TECHNICAL.md](TECHNICAL.md): design, surface, data, implementation, tests and limits.
- [CHANGELOG.md](CHANGELOG.md): dated history.
- [BACKLOG.md](BACKLOG.md): corrections and future work (only when reopening).

## 7. Decisions

| Decision | Gloss |
|---|---|
| D-13 | Module 3 is the aggregated requirements view across modules. |
| D-32 | The requirements catalogue opens from the top banner with a module-state filter and section grouping. |

## 9. Next step

Closed as `Tested` on 2026-11-16 after the owner's verification. Module 4 —
Modules Dashboard is the active module.

## 10. Module-specific notes

### Open points

- Shape: requirements catalogue across modules (owner, 2026-11-16).
- Placement: top-banner action next to Backlog, with Home returning to `PROJECT_STATE.md` (owner, 2026-11-16).
- Sections: functional requirements, business rules, flows, validations and edge cases (owner, 2026-11-16).
- Status filter: module state, never a per-requirement state (owner, 2026-11-16).
- Grouping: `None` / `Module` / `Section`, with sorting inside groups.
- Acceptance evidence and traceability are not part of this catalogue; they stay in each `REQUIREMENTS.md` §9.
