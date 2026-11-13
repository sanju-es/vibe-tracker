# Module 0 — BACKLOG

> **Purpose:** the `CORE-NN` work items of the shared platform and their state.
> **Read when:** planning shared work or checking what the platform already provides.
> **Canonical for:** the work items of module 0.
> **Do not duplicate:** the invariants (`MODULE.md` §4) and the implementation detail (`TECHNICAL.md`).

**Last update:** 2026-11-13

---

## 1. Entries

| ID | Date | Type | Description | Origin | Priority | Status |
|---|---|---|---|---|---|---|
| CORE-01 | 2026-11-13 | improvement | Skeleton and single-file build | D-14 | high | implemented (2026-11-13) |
| CORE-02 | 2026-11-13 | improvement | Typed semantic model | D-14 | high | implemented (2026-11-13) |
| CORE-03 | 2026-11-13 | improvement | Folder and file access gateway | D-14 | high | implemented (2026-11-13) |
| CORE-04 | 2026-11-13 | improvement | Markdown-to-nodes pipeline | D-14 | high | implemented (2026-11-13) |
| CORE-05 | 2026-11-13 | improvement | English message dictionary | D-14 | high | implemented (2026-11-13) |
| CORE-06 | 2026-11-13 | improvement | Design tokens and shared primitives | D-14 | high | implemented (2026-11-13) |
| CORE-07 | 2026-11-13 | improvement | Table semantics | D-14 | high | implemented (2026-11-13) |
| CORE-08 | 2026-11-13 | improvement | Project reference index | D-14 | high | implemented (2026-11-13) |

## 2. States

- `new` — registered, not approved, not planned.
- `in progress` — accepted and being worked.
- `blocked` — waits on another item, named in the cell.
- `deferred` — accepted, deliberately postponed behind a named milestone.
- `implemented (YYYY-MM-DD)` — delivered on that date.
- `moved (<ID>, YYYY-MM-DD)` — transferred to another module or backlog.
- `discarded` — rejected; the reason stays in the row.

## 3. Types

- `correction` — fixes documented behaviour.
- `improvement` — new capability or refinement of an existing one.
- `docs` — documentation only.
- `test` — test coverage or fixtures.
- `tech-debt` — internal quality with no visible change.
- `performance` — speed or resource use.
