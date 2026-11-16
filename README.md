<<<<<<< HEAD
# Project Tracking

> A portable, install-free and offline web app that interprets the Markdown
> documentation of a project —chapters, tables, statuses and references— and
> turns it into navigable, interactive content.

Module 1 — Structured Reader is `Implemented` and awaits the owner's verification.
The application runs: `npm run dev` for development and `npm run build` for the
single-file artifact.

Open the built `index.html`, choose the project folder, and read the documentation
without opening a Markdown editor. The artifact needs no server; its only external
assets are the allowlisted, SRI-pinned icons and typeface (D-22, D-23), and it
stays usable without network.

> From `file://` the app uses a folder input; when served (for example with
> `npm run preview`) it uses the directory picker.

## 1. What it is

Project Tracking is an internal tool meant to travel with a project. It is built
as a static web app compiled into **one self-contained `index.html`**: all
JavaScript, CSS and dependencies are inlined, so the file can be copied, shared
and opened offline.

It is not a Markdown viewer. It reads the documentation semantically:

- **Chapters and sections** keep stable anchors; the fixed sidebar lists documents
  by file name.
- **Tables** become real tables: one line per row, recognised statuses, text and
  status filters, sorting by column, and the full row in a modal on click.
- **References** between documents open the detail of the referenced row in a
  modal, and every known identifier in the text opens the item that defines it.
- **Read-only.** The app never writes to the Markdown files.
- **Documentation scope.** Reads Markdown at the project root and under `docs/**`;
  hidden, tooling, dependency and build folders are ignored (D-30).
- **Local by default.** No telemetry and no request of the app itself. Icons and the
  typeface come from the allowlisted CDNs, pinned with SRI; without network they
  degrade to glyphs and the system font.
- **Portable.** No installation and no build step for the end user: a single HTML
  file.
- **Focused reading.** A fixed sidebar keeps navigation reachable while the
  document scrolls, and the content starts after it.
- **Reload.** Re-scans the current folder without choosing it again.
- **Modules overview.** Selecting *Modules* in the sidebar shows a table with the
  module folder, its name and its state; selecting a module opens its backlog table
  with search, status filters and sorting.
- **Backlog board.** The top banner opens a full cross-module backlog board with
  text and status filters, grouping by module or status, row detail and a jump to
  the source row; *Home* returns to the project state.
- **Requirements catalogue.** The top banner also opens every module's functional
  requirements, business rules, flows, validations and edge cases, filtered by
  module state and grouped by module or section, with a jump to the source.
- **Dashboard.** A project-health view with documented module states, the `Tested`
  progress bar, the active module and a filterable timeline of module changelogs.
- **Light only.** One appearance, no theme switch (D-18).

The Markdown files are the source of truth. The app derives an in-memory semantic
model and only renders it.

## 2. Languages

| Scope | Language |
|---|---|
| Code, identifiers and comments | English |
| Documentation | English |
| User interface | English |

## 3. Stack

Stack, versions and supported browsers are recorded once in
[`PROJECT_STATE.md` §2](PROJECT_STATE.md#2-stack-and-environment).

## 4. Development

Requirements: Node ^20.19 or ≥22.12, and npm. The environment is native: there
are no services to containerise and no Docker setup.

```bash
npm install
npm run dev      # development server on http://localhost:5173
npm run check    # svelte-check over TypeScript and Svelte sources
npm run test     # Vitest
npm run lint     # ESLint + Prettier check
npm run docs:check  # documentation audit (blocking)
npm run build    # check plus the single self-contained index.html
npm run preview  # serves the production build locally
```

The build output is a single `index.html` that can be opened directly from disk;
its size is recorded in
[`docs/ARCHITECTURE.md` §9](docs/ARCHITECTURE.md#9-environments-and-operations). It
carries a content security policy that allows only the jsDelivr host used by the
icons and the typeface (D-22, D-23), both with SRI and with a local fallback.

## 5. Documentation

| Document | Content |
|---|---|
| [`PROJECT_STATE.md`](PROJECT_STATE.md) | Index and global state: modules, states, next steps |
| [`docs/WORKFLOW.md`](docs/WORKFLOW.md) | Module cycle, states, change management, definition of done |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Architecture, layers, data model, conventions |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Decision log: approved, adopted by default and open questions |
| [`docs/DOC-STANDARD.md`](docs/DOC-STANDARD.md) | Documentation standard: form, identifiers, vocabularies and checks |
| [`AGENTS.md`](AGENTS.md) | Onboarding rules and quality routing for AI agents |
| `docs/modules/` | One folder per module with its requirements, technical design, changelog and backlog (module 0 has no requirements document) |

Documentation linter:

```bash
node scripts/docs-audit.mjs             # fails on any must
node scripts/docs-audit.mjs --advisory  # reports without failing
node scripts/docs-audit.mjs --json      # machine-readable report
```

## 6. Version control

The project uses Git on a trunk-based workflow: work happens on `main` with short
task branches, and each closed task is one commit with a Conventional Commits
message. Only approved work is committed.
=======
# vibe-tracker
Visor cero-instalación en HTML puro (solo lectura, directo en el navegador) — lee los archivos .md de mi plantilla para mostrar de un vistazo el proyecto completo.
>>>>>>> 6bbc63757c81e5f4716cfe6afec28d3c86dd070a
