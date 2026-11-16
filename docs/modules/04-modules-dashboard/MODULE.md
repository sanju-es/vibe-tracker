# Module 4 — Modules Dashboard

> **Purpose:** the modules dashboard module of the reader.
> **Read when:** planning, analysing or closing this module.
> **Canonical for:** its scope, decisions and next step.
> **Do not duplicate:** requirements (`REQUIREMENTS.md`), implementation (`TECHNICAL.md`) and history (`CHANGELOG.md`).

**Status:** `Tested` (2026-11-16)
**Last update:** 2026-11-16

---

## 1. Purpose

Show the state of the whole project on one surface: which modules exist, in which state each one is, how much of the roadmap is closed and how the work evolved.

This is a project-health view, not a replacement for the Modules overview: module 1 keeps document navigation and the backlog counts of each module; module 4 adds the roadmap summary, the active module and the dated history.

## 2. Scope

### In scope

- Read the module inventory and states documented in `PROJECT_STATE.md`.
- Summarise progress across modules (pending, in progress, closed) as documented counts, never inferred from code or dates.
- Show the dated entries of each module `CHANGELOG.md` as a timeline, filtered by module or date.
- Identify the active module at a glance.
- Keep the Modules overview of module 1 as the document-level view; this dashboard is project-level.

### Out of scope

- Changing a module state from the app.
- Backlog boards (module 2) and requirements views (module 3).
- Global search (module 5).

## 3. Actors and screens

Single internal user, no accounts. The top banner offers *Dashboard* next to
*Requirements*, *Backlog* and *Home*. The dashboard shows the Core card, the
roadmap cards and progress bar, the module table and the changelog timeline with
its module filter.

## 4. Domain model

The view derives from the existing model: modules and documented states, the
active module line in `PROJECT_STATE.md`, the last update of each `MODULE.md`, and
the dated headings of each `CHANGELOG.md`. Invariants: read-only; every count is a
documented state; Core is permanent and outside the closable total; timeline
entries keep an `ItemTarget` to their source heading; an undated heading is not an
entry.

## 5. Delivered features

- Top-banner *Dashboard* action.
- Roadmap cards for total, `Tested`, in progress and `Pending`, plus `Blocked` when present.
- `Tested` progress bar with Core outside the closable total.
- Module table with folder, name, state, last update and active marker.
- Filterable changelog timeline with source jump.

## 6. Documentation map

- [REQUIREMENTS.md](REQUIREMENTS.md): functional requirements, rules and acceptance.
- [TECHNICAL.md](TECHNICAL.md): design, surface, data, implementation, tests and limits.
- [CHANGELOG.md](CHANGELOG.md): dated history.
- [BACKLOG.md](BACKLOG.md): corrections and future work (only when reopening).

## 7. Decisions

| Decision | Gloss |
|---|---|
| D-10 | Permanent Core container (module 0) for shared platform work. |
| D-33 | The dashboard opens from the top banner with roadmap cards, a progress bar and a filterable changelog timeline. |

## 9. Next step

Closed as `Tested` on 2026-11-16 after the owner's verification. Module 5 — Search
and Index is the active module.

## 10. Module-specific notes

### Open points

- The state shown is the documented state; the app never infers progress from code or from dates.
- Module 0 (Core) is permanent, shown separately and excluded from the closable total.
- Placement: top-banner *Dashboard* action, consistent with Backlog and Requirements (owner, 2026-11-16).
- Progress: documented counts plus the `Tested` bar; no effort or code metric (owner, 2026-11-16).
- Timeline: every dated changelog heading, newest first, filterable by module (owner, 2026-11-16).
