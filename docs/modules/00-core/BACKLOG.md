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
| CORE-09 | 2026-11-13 | docs | `02`–`06` `REQUIREMENTS` §8 attributes folder access, scanning, the semantic model and the reference index to module 1, while `MODULE.md` §2 and `01 TECHNICAL` §1 place those layers in Core | Audit 2026-11-13 | medium | implemented (2026-11-13) |
| CORE-10 | 2026-11-13 | docs | `02`–`06` `MODULE` §7 holds loose bullets instead of the `D-NN` index of §7.3; omit the slot or list the decisions | Audit 2026-11-13 | low | implemented (2026-11-13) |
| CORE-11 | 2026-11-13 | docs | `02`–`06` `TECHNICAL` §2 and §7 repeat the same known constraint, so the fact has two homes in one file | Audit 2026-11-13 | low | implemented (2026-11-13) |
| CORE-12 | 2026-11-13 | docs | `README.md` carries a `**Status:**` line that G-12 reserves for module files and the standard | Audit 2026-11-13 | low | implemented (2026-11-13) |
| CORE-13 | 2026-11-13 | docs | The build size is stated twice, in `README` §4 and `ARCHITECTURE` §9, instead of linking to one home | Audit 2026-11-13 | low | implemented (2026-11-13) |
| CORE-14 | 2026-11-13 | docs | `ARCHITECTURE` §8 does not list `.opencode/`, although `AGENTS.md` §3 routes every closure through those agents | Audit 2026-11-13 | low | implemented (2026-11-13) |
| CORE-15 | 2026-11-13 | docs | `D-04` still says `localStorage` keeps UI preferences, a fact `D-16` and `D-18` removed; it needs a dated supersession note | Audit 2026-11-13 | medium | implemented (2026-11-13) |
| CORE-16 | 2026-11-13 | docs | `CHANGELOG` sends the work-item evidence to `MODULE.md` §5, which is *Delivered features*; the evidence lives in `TECHNICAL.md` §8 | Audit 2026-11-13 | low | implemented (2026-11-13) |
| CORE-17 | 2026-11-13 | docs | The agent and skill contracts contradict the standard and the architecture: `frontend` says the app ships no asset (D-23 loads two), allows `{@html}` with parsed content (D-12 and CR-03 forbid it), `testing` names a `tests/fixtures` directory that does not exist, `docs-auditor` accepts `Pending analysis` and says anchors are unchecked (E-04 is active), and `quality-gate` requires `REQUIREMENTS.md` from module 0, which has none | Audit 2026-11-13 | medium | implemented (2026-11-13) |
| CORE-18 | 2026-11-13 | docs | The linter implements none of E-21 to E-26 and validates 6 of the 10 registered tables, so G-12, G-15, G-16, G-23, §7.2 and R-07 have a rule and no enforcement | Audit 2026-11-13 | medium | implemented (2026-11-13) |
| CORE-19 | 2026-11-13 | correction | The identifier index ignores a heading that starts with an identifier, so a requirement written as `### FR-NN — Title` is not a definition and a mention of `FR-N` opens the acceptance row instead | Audit 2026-11-13 | medium | implemented (2026-11-13) |

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
