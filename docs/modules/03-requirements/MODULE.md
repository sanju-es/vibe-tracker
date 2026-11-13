# Module 3 — Requirements

> **Purpose:** the requirements module of the reader.
> **Read when:** planning, analysing or closing this module.
> **Canonical for:** its scope, decisions and next step.
> **Do not duplicate:** requirements (`REQUIREMENTS.md`), implementation (`TECHNICAL.md`) and history (`CHANGELOG.md`).

**Status:** Pending
**Last update:** 2026-11-13

---

## 1. Purpose

Aggregate the functional requirements, business rules and validations documented in every module into one readable view, so the agreed behaviour of the whole project can be reviewed in one pass.

The reader shows each document as it is; this module adds the cross-module view.

## 2. Scope

### In scope

- Collect requirements, business rules, flows, validations and edge cases from every module `REQUIREMENTS.md` and `MODULE.md` found in the project.
- Group them by module and by section type, with text and status filters.
- Show the identifier of each item and link it to its source document.
- Show `Pending analysis` modules as such; never hide or fill them.

### Out of scope

- Per-document rendering and table interaction: those belong to the reader (module 1).
- Editing requirements or adding new ones from the app.
- Backlog boards (module 2) and the modules dashboard (module 4).
- Global text search (module 5).

## 6. Documentation map

- [REQUIREMENTS.md](REQUIREMENTS.md): functional requirements, rules and acceptance.
- [TECHNICAL.md](TECHNICAL.md): design, surface, data, implementation, tests and limits.
- [CHANGELOG.md](CHANGELOG.md): dated history.
- [BACKLOG.md](BACKLOG.md): corrections and future work (only when reopening).

## 7. Decisions

- The app is read-only; `Pending analysis` entries must be shown as such and never hidden or filled in by the app.
- The exact grouping and presentation is `Pending analysis`; nothing is implemented yet.

## 9. Next step

Wait for the owner to select the module, then analyse it.
