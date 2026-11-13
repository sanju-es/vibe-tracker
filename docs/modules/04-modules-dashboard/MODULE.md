# Module 4 — Modules Dashboard

> **Purpose:** the modules dashboard module of the reader.
> **Read when:** planning, analysing or closing this module.
> **Canonical for:** its scope, decisions and next step.
> **Do not duplicate:** requirements (`REQUIREMENTS.md`), implementation (`TECHNICAL.md`) and history (`CHANGELOG.md`).

**Status:** Pending
**Last update:** 2026-11-13

---

## 1. Purpose

Show the state of the whole project on one surface: which modules exist, in which state each one is, how much of the roadmap is closed and how the work evolved.

## 2. Scope

### In scope

- Read the module inventory and states documented in `PROJECT_STATE.md`.
- Summarise progress across modules (pending, in progress, closed).
- Show the dated entries of each module `CHANGELOG.md` as a timeline.
- Identify the active module at a glance.

### Out of scope

- Changing a module state from the app.
- Backlog boards (module 2) and requirements views (module 3).
- Global search (module 5).

## 6. Documentation map

- [REQUIREMENTS.md](REQUIREMENTS.md): functional requirements, rules and acceptance.
- [TECHNICAL.md](TECHNICAL.md): design, surface, data, implementation, tests and limits.
- [CHANGELOG.md](CHANGELOG.md): dated history.
- [BACKLOG.md](BACKLOG.md): corrections and future work (only when reopening).

## 7. Decisions

- The state shown is the documented state; the app does not infer progress from code or from dates.
- Module 0 (Core) is permanent and must not be counted as a closable module; how it is represented is `Pending analysis`.
- Nothing is implemented yet.

## 9. Next step

Wait for the owner to select the module, then analyse it.

## 10. Module-specific notes

### Dependencies

- **Depends on:** module 1 (Structured Reader) for folder access, scanning and the reading workspace.
- **Shared code:** module 0 for the model and the Markdown extractors.
