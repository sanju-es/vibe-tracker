<!-- # Proyecto iniciado con plantilla sanju v1 -->

# PROJECT_STATE.md — Project Tracking

> **Purpose:** global index and state of the project.
> **Read when:** every task; module selection and the next step.
> **Canonical for:** identity, stack summary, module states, open problems and next steps.
> **Do not duplicate:** architecture detail (`docs/ARCHITECTURE.md`), decisions (`docs/DECISIONS.md`) and module content (`docs/modules/`).

**Last update:** 2026-11-13 — documentation standard adopted, migrated and amended
(D-26, D-27); module 1 awaits owner verification.

---

## 1. Project

- **What it is:** A portable, install-free and offline web app that interprets
  the Markdown documentation of a project —chapters, tables, statuses and
  references— and presents it as navigable, interactive content.
- **Goal:** Show all project files and folders at a glance and present what is
  inside them structurally: recognisable states, tables that can be filtered and
  sorted, and references that open the detail of the referenced item.
- **Audience and constraints:** Internal use. Shipped as a bundled tool with the
  project; anyone with the project can open it and each person sees their own
  local files. Works offline, needs no installation permissions and is distributed
  as a single `index.html`. Icons, fonts or libraries may come only from the
  allowlisted CDNs, pinned with SRI and optional (D-22). Chrome and Edge only.
- **Commercial basis:** Internal only.
- **Project type:** 3 — Frontend only.
- **Languages:** Code: English · Docs: English · UI: English

## 2. Stack and environment

| Layer | Technology |
|---|---|
| App shell | Browser; one self-contained `index.html` |
| UI framework | Svelte 5 + TypeScript |
| Build and bundling | Vite 8 + `vite-plugin-singlefile` |
| Styling | Tailwind CSS 4 + own components |
| Icons | Lucide 1.72.0 via jsDelivr, SRI, glyph fallback |
| Typography | Inter via jsDelivr, SRI, system-font fallback |
| Markdown | `marked` 18 lexer + own semantic pipeline |
| State | Svelte 5 runes stores |
| Folder access | Directory picker, folder input from `file://` (D-15) |
| Persistence | none; the appearance is fixed and no preference is stored |
| Tests | Vitest |
| Lint and format | ESLint + Prettier |

**Common values**

| Key | Value |
|---|---|
| Development commands | `npm run dev`, `npm run check`, `npm run build`, `npm run preview` |
| Quality commands | `npm run test`, `npm run lint`, `npm run docs:check` |
| Dev port | 5173 |
| Environment variables | none |
| Supported browsers | Chrome and Edge (Chromium) |
| Deliverable | one self-contained `index.html` |

Detail and conventions: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## 3. Architecture (one line)

- **Client (only platform):** Svelte 5 SPA compiled into one `index.html`; reads
  a folder chosen by the user, builds a semantic model of its documents —chapters,
  tables, statuses and references— and renders it with interactive components.

## 4. Way of working

Incremental development by modules, cycle **analysis → proposal → approval →
implementation → closure**, explicit states, reopenings, change management with
impact analysis, documentary honesty.

Full rules: [`docs/WORKFLOW.md`](docs/WORKFLOW.md).

## 5. Quick links

- Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Decisions: [`docs/DECISIONS.md`](docs/DECISIONS.md)
- Workflow: [`docs/WORKFLOW.md`](docs/WORKFLOW.md)
- Documentation standard: [`docs/DOC-STANDARD.md`](docs/DOC-STANDARD.md)
- Modules: [`docs/modules/`](docs/modules/)
- Agent: [`AGENTS.md`](AGENTS.md)

## 6. Module inventory and state

| # | Module | State | Open items | Documentation |
|---|---|---|---|---|
| 0 | Core | Active (permanent) | `CORE-09`…`CORE-16` | [`00-core`](docs/modules/00-core/MODULE.md) |
| 1 | Structured Reader | Implemented | `01 B-01`…`01 B-03` | [`01-structured-reader`](docs/modules/01-structured-reader/MODULE.md) |
| 2 | Backlog Board | Pending | — | [`02-backlog-board`](docs/modules/02-backlog-board/MODULE.md) |
| 3 | Requirements | Pending | — | [`03-requirements`](docs/modules/03-requirements/MODULE.md) |
| 4 | Modules Dashboard | Pending | — | [`04-modules-dashboard`](docs/modules/04-modules-dashboard/MODULE.md) |
| 5 | Search and Index | Pending | — | [`05-search-index`](docs/modules/05-search-index/MODULE.md) |
| 6 | Distribution | Pending | — | [`06-distribution`](docs/modules/06-distribution/MODULE.md) |

**Active module:** 1 — Structured Reader (`docs/modules/01-structured-reader/`),
state `Implemented`.
**Next step:** the owner verifies the reader against its requirements; the module
moves to `Tested` when that verification is recorded.

## 7. Open problems and pending corrections

- The selected folder is not remembered between sessions; choosing it again is a
  single action. Persisting it needs IndexedDB and stays an open question in
  [`docs/DECISIONS.md`](docs/DECISIONS.md) §4.
- Documentation limitations belong to the module that owns them and are not
  repeated here: identifiers resolved only when the index knows them, the
  folder-input snapshot, single-column sorting, the fixed English and light
  interface and the CDN fallbacks are listed once in
  [`01-structured-reader/TECHNICAL.md`](docs/modules/01-structured-reader/TECHNICAL.md)
  §7.
- The allowlist and the pinned assets are a decision, not an open problem: see
  `D-22` and `D-23` in [`docs/DECISIONS.md`](docs/DECISIONS.md).

## 8. Development credentials and data

> **Local environment only.** The app has no accounts, tokens or secrets: each
> user reads their own files. Never store real secrets here.

_None._

## 9. Next steps

1. Verify the revised reader in Chrome or Edge with a real project folder and the
   built `index.html`: fixed sidebar and its own scroll, content after it, reload
   action, compact typography, module state text, nested project entries,
   three-level menu, one-line tables with row detail.
2. Record the verification in `docs/modules/01-structured-reader/TECHNICAL.md` §5
   and move the module to `Tested`.
3. Choose the next module (2 — Backlog Board is the recommended next step).
