# AGENTS.md — Project Tracking

> **Purpose:** process contract and quality routing for every task in this repository.
> **Read when:** starting any task, or when a routing or permission question appears.
> **Canonical for:** onboarding order, immediate rules, quality routing and project rules.
> **Do not duplicate:** the module cycle (see [docs/WORKFLOW.md](docs/WORKFLOW.md)) and the documentation form (see `docs/DOC-STANDARD.md`).

**Last update:** 2026-11-13

---

## 1. Onboarding

1. Read **`PROJECT_STATE.md`** — index and global state (project type, modules,
   states, next steps).
2. Read **`docs/WORKFLOW.md`** — module cycle, states, reopenings, documentary
   honesty.
3. Identify the **active module** and load **only** its documentation in
   `docs/modules/<module>/`. If the task touches shared platform code, also load
   `docs/modules/00-core/MODULE.md`.
4. Read on demand: `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` and the optional
   documents listed in the documentation map.

## 2. Immediate rules

- **No code without an approved proposal.** Analysis → proposal → approval →
  implementation → closure. The owner has the last word.
- Do not turn proposals into confirmed requirements or approved decisions. New
  decisions are appended with a date; nothing is overwritten.
- Do not invent requirements or behaviour. If information is missing, **ask**.
- This project has no own API. Do not introduce an API contract or endpoint documentation.
- Update the affected documentation **in the same task**.
- One active module at a time. After closing one, wait for the owner to choose
  the next.
- Write code, comments, documentation and user-facing interface text in
  **English**. Keep folder and file names in English kebab-case unless the owner
  approved a different convention.
- Stage only the files of the current task (`git add <paths>`). Never `git add -A`
  or `git add .` without reviewing the diff first.

## 3. Quality routing

Before editing a file, load the matching skill. At closure, run the matching
review.

| Task touches | Load before editing | Run at closure |
|---|---|---|
| UI code (`src/views`, `src/components`) | `frontend` | `quality-gate` |
| Domain logic, parsing, stores, folder access | `testing` (+ `frontend` when the UI changes) | `quality-gate` |
| `docs/**` only | none | `docs-auditor` |

Blocking findings (security, data loss, contract mismatch) stop the task and go
to the owner. Advisory findings are reported and left to the owner.

**Closure gate.** `npm run docs:check` exits 0 before a commit, a tag or a module
moving to `Implemented` or `Tested`. The command is blocking by default;
`--advisory` reports without failing and is a migration aid, never a closure
state.

## 4. Project rules

- No new dependency without the owner's approval.
- No network except the allowlisted providers (jsDelivr, cdnjs, unpkg, Google
  Fonts). Every external asset is pinned, carries an SRI hash and is
  non-essential: the app must stay usable if it fails (D-22).
- Markdown parsing never mixes presentation: it returns typed data and the UI
  only renders it.

## 5. Documentation map

- Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Decisions: [`docs/DECISIONS.md`](docs/DECISIONS.md)
- Workflow: [`docs/WORKFLOW.md`](docs/WORKFLOW.md)
- Documentation standard: [`docs/DOC-STANDARD.md`](docs/DOC-STANDARD.md)
- Modules: `docs/modules/<module>/`
- Documentation linter: `npm run docs:check` runs `node scripts/docs-audit.mjs`
  and fails on any `must`; `--advisory` only reports.

## 6. Minimum documentation load

`PROJECT_STATE.md` + `docs/WORKFLOW.md` + the active module's `.md` files.
`ARCHITECTURE.md` and `DECISIONS.md` only when the task needs them. Do not load
the other modules' documentation.
