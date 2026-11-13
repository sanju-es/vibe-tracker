# Module 1 — Structured Reader

> **Purpose:** interpret the project documentation structurally and present it as navigable, interactive content.
> **Read when:** planning, reviewing or closing this module.
> **Canonical for:** its scope, delivered capabilities, decisions and next step.
> **Do not duplicate:** requirements (`REQUIREMENTS.md`), implementation (`TECHNICAL.md`) and history (`CHANGELOG.md`).

**Status:** `Implemented` (2026-11-13)
**Last update:** 2026-11-13

---

## 1. Purpose

Read the project documentation as **structured content**, not as rendered text.
The reader interprets what each document contains —chapters, tables, statuses and
references— and presents it in a navigable, interactive way: a table is a table
with filters, a status is recognisable at a glance, and a reference to another
document opens its detail.

The goal: open a project folder and understand its state without reading raw
Markdown.

## 2. Scope

### In scope

- Select the project folder and scan its `.md` documents and referenced images.
- Navigate with a fixed sidebar: two blocks (*Project*, *Modules*), module titles
  as folder names, module state as icon **and** text, project documents indented as
  children, and documents by file name with the folder added when the name repeats.
- Open a modules overview from the *Modules* block: folder, name and state of every
  module.
- Open a module page with its backlog table, searchable, filterable by status and
  sortable.
- Render documents from a semantic node tree: headings, paragraphs, lists, tables,
  code, quotes, links and inline images. No injected HTML.
- Render tables as one line per row with truncated cells; clicking a row opens the
  full row detail, and every identifier inside a cell is an independent reference.
- Turn every identifier known to the project into a reference in running text and
  list items, opening a modal with the item that defines it.
- Open a document or an image reference in a modal, and navigate to it from the
  modal.
- Keep the document to the right of the sidebar, with a compact type scale so more
  content fits, and no outline column.
- Present the interface in English, in a light-only appearance (D-16, D-18) and with
  Lucide icons plus Inter, both with local fallbacks (D-23).
- Reload the current folder from the top bar without choosing it again.
- Store no preferences between sessions.
- Empty, loading, success and error states, with scan progress and cancellation.
- Full keyboard path, visible focus and a skip-to-content link.

### Out of scope

- Aggregated backlog board across modules (module 2).
- Aggregated requirements and rules view (module 3).
- Modules dashboard with state and changelog timeline (module 4).
- Global search and cross index UI (module 5).
- Distribution polish, final accessibility audit and artifact identity (module 6).
- Writing, editing or reformatting any project file.
- Changing a backlog or module state from the app.
- Remembering the last folder across sessions.

## 3. Actors and screens

- **Actor:** the owner and anyone who keeps the project documentation; they read
  their own local folder and never edit through the app.
- **Screens:** empty state with folder selection; reading workspace (top bar,
  fixed sidebar and document); modules overview; module page with its backlog;
  row-detail, document-preview and image-preview modals.
- **Operating environment:** Chromium browsers, secure context for the directory
  picker, folder input from `file://`.

## 4. Domain model

The reader works on an in-memory model built from the selected folder:
`Project` → `Document` → `Section`/`Table` → `Row`/`Cell`, plus `Status`,
`Reference` and `ImageAsset`. Its detail and the shared types live in
[`TECHNICAL.md`](TECHNICAL.md) §3 and in module 0.

## 5. Delivered features

- Folder selection with two adapters behind one interface, scan progress and
  cancellation (CORE-03).
- Fixed sidebar with project and module blocks, module state as icon and text, and
  file-name labels (D-11, D-19).
- Modules overview page (D-24) and module page with the backlog table (D-25).
- Semantic renderer for headings, lists, tables, quotes, code, links and images
  (D-12).
- One-line tables with status chips, text and status filters, single-column sorting
  and row detail (D-17).
- Identifier references in running text and list items (D-21).
- Document metadata header from the universal skeleton: front block, status and
  last update, with the raw lines removed from the body (01 FR-17).
- `DOC-STANDARD.md` under *Project* as *Documentation standard* and real line breaks
  for `<br>` (01 FR-18).
- Scope-aware references and independent identifiers inside a table cell (01 FR-19).
- Module overview with a wide name column, one backlog count per status found in
  the backlogs and the state at the far right with icon, colour and label; the same
  treatment in the sidebar; backlog defaults hiding `implemented` and `discarded`
  (01 FR-20).
- Document, image and row modals with keyboard trap and focus return.
- Reload of the current folder (D-20).
- English-only, light-only interface with Lucide icons and Inter (D-16, D-18,
  D-23).

## 6. Documentation map

- [REQUIREMENTS.md](REQUIREMENTS.md): functional requirements, rules, flows,
  validations, dependencies and acceptance.
- [TECHNICAL.md](TECHNICAL.md): design, surface, data, implementation, tests and
  limits.
- [CHANGELOG.md](CHANGELOG.md): dated history.
- [BACKLOG.md](BACKLOG.md): corrections and future work (only when reopening).

## 7. Decisions

| Decision | Gloss |
|---|---|
| D-11 | Navigation by two collapsible blocks, categories from file names and state as icon plus text. |
| D-12 | Semantic reading with structured tables instead of a plain Markdown view. |
| D-14 | Approved implementation proposal: components, stores, table interactions and tests. |
| D-15 | Folder access with a directory picker and a folder-input fallback, behind one interface. |
| D-16 | Interface in English only. |
| D-17 | One-line clickable tables, 75 % content width and drawer navigation (superseded in part by D-19/D-20). |
| D-18 | Light-only appearance, no theme control. |
| D-19 | Drawer stays open, three menu levels, file-name labels and full-width content. |
| D-20 | Fixed sidebar with its own scroll and a reload action. |
| D-21 | Identifiers are references anywhere in the text. |
| D-22 | Closed CDN allowlist, pinned versions and SRI. |
| D-23 | Lucide icons and Inter with local fallbacks. |
| D-24 | Modules overview page. |
| D-25 | Module page with its backlog table. |

## 9. Next step

The owner verifies the behaviour against [`REQUIREMENTS.md`](REQUIREMENTS.md) §9 in
Chrome or Edge, with a real project folder and with the built `index.html`. The
module moves to `Tested` when that verification is recorded.
