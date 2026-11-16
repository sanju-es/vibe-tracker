# Module 1 — BACKLOG

> **Purpose:** corrections and future work of the reader, with their state.
> **Read when:** reopening or planning this module.
> **Canonical for:** `B-NN` entries of this module.
> **Do not duplicate:** requirements (`REQUIREMENTS.md`) and history (`CHANGELOG.md`).

**Last update:** 2026-11-16

---

## 1. Entries

| ID | Date | Type | Description | Origin | Priority | Status |
|---|---|---|---|---|---|---|
| B-01 | 2026-11-13 | improvement | Multi-column sorting in tables (for example sort by module and then by status) | Owner | low | new |
| B-02 | 2026-11-13 | docs | The module page hides two backlog statuses in `TECHNICAL` §5 and three in §7 and `01 FR-20`; confirm which list is correct and align them | Audit 2026-11-13 | medium | implemented (2026-11-13) |
| B-03 | 2026-11-13 | docs | Acceptance evidence for `01 FR-2`, `01 FR-6`, `01 FR-15` and `01 FR-20` cites a unit suite for behaviour only the browser check covers; mark the manual part | Audit 2026-11-13 | medium | implemented (2026-11-13) |
| B-04 | 2026-11-13 | docs | `REQUIREMENTS` §2 lists the requirements as bullets while §7.4 mandates `### FR-NN — Title`; converting them removes the FR from the reference index, because the app indexes rows and list items and not headings, so the rule and the indexing must be reconciled | Audit 2026-11-13 | medium | implemented (2026-11-13) |
| B-05 | 2026-11-16 | correction | The module state column in the modules overview clips long states such as `Implementation proposal`; the full state text must be visible | Owner | medium | implemented (2026-11-16) |

`B-01` keeps the position it had when the standard took effect; `B-02` to `B-04` were registered by the later audit. No identifier was renumbered (D-26, R-08).

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
