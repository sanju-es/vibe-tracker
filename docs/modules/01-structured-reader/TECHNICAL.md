# Module 1 — TECHNICAL

> **Purpose:** design, surface, data, implementation, behaviour and evidence of the reader.
> **Read when:** changing the reader, reviewing its design or checking its limitations.
> **Canonical for:** components, stores, interaction detail, tests and limits of this module.
> **Do not duplicate:** requirements (`REQUIREMENTS.md`) and shared architecture (`docs/ARCHITECTURE.md`).

**Status:** `Implemented` (2026-11-13)
**Last update:** 2026-11-13

---

## 1. Design and principles

- **Semantic, not textual.** The renderer walks a typed node tree; document HTML is
  never injected (D-12).
- **One folder, read only.** The project lives in memory and nothing is written back
  (01 BR-1).
- **Shared platform, thin module.** Folder access, parsing, model and format live
  in module 0; this module composes them (CORE-02 to CORE-08).
- **One-line tables with full detail on demand.** Truncation is visual only and the
  row modal keeps every cell (D-17, 01 BR-9).
- **References are data, not markup.** The index decides what becomes a reference;
  unknown codes stay plain text (D-21).
- **Fixed shell.** Sidebar and top bar never move with the document; the content
  occupies the remaining width (D-19, D-20).
- **No stored preferences.** Language, appearance and folder are fixed per session
  (D-16, D-18).

## 2. Surface

No endpoints: the project has no own API. The table below is the implemented
surface; the approved proposal is recorded in D-14 and the revisions in D-16 to
D-25.

### Layout

```text
┌──────────────────── top bar ────────────────────┐
│ project name · document      ↻ reload · folder  │
├───────────────┬─────────────────────────────────┤
│ sidebar       │ document body                   │
│ Project       │                                 │
│ Modules       │ (compact type, own scroll)      │
└───────────────┴─────────────────────────────────┘
```

The sidebar is fixed: it stays visible, has its own scroll and the content starts
to its right, so it occupies layout space. It is always open; there is no drawer,
no hover opening and no `inert` state. There is no theme switch and no dark theme
(D-18). Typography is compact (14 px base) so more content fits on screen (D-20).
The top bar carries a reload action that re-scans the current folder.

### Components

Shared primitives —`modal`, `status-chip`, `icon-button`, `module-status-icon`—
live in `src/components/primitives` and belong to CORE-06.

| Component | Props | Events |
|---|---|---|
| `views/empty-state.svelte` | none (reads stores) | none |
| `views/reading-workspace.svelte` | `project` | none |
| `components/project-navigation.svelte` | `project`, `activeDocumentId` | `onselect(documentId)` |
| `components/document-body.svelte` | `document` | none (delegates to stores) |
| `components/document-header.svelte` | `document`, link/image/reference handlers | none (renders `document.meta`) |
| `components/nodes/node.svelte` | `node`, `table`, `documentId`, `documentTitle` | `onopenlink(run)`, `onopenimage(run)` |
| `components/nodes/inline-runs.svelte` | `runs` | `onopenlink(run)`, `onopenimage(run)` |
| `components/nodes/data-table.svelte` | `table`, `documentId`, `documentTitle`, `excludeStatuses`, `rowTarget` | table actions go through the `tables` store |
| `components/nodes/image.svelte` | `path`, `alt`, `onclick` | `onclick` |
| `components/detail-modal.svelte` | none (reads stores) | none |
| `components/modules-overview.svelte` | `project`, `onopenmodule` | `onopenmodule(moduleNumber)` (table of folder, name, backlog counts per status and state) |
| `components/module-page.svelte` | `project`, `moduleNumber` | none (module backlog table) |
| `components/scan-progress.svelte` | `done`, `total`, `warning` | `oncancel` |
| `components/error-notice.svelte` | `error` | `onretry` |
| `components/primitives/modal.svelte` | `title`, `onclose`, `children` | `onclose` |
| `components/primitives/status-chip.svelte` | `status`, `label` | none |
| `components/primitives/icon-button.svelte` | `label`, `onclick`, `children` | `onclick` |
| `components/primitives/module-status-icon.svelte` | `status`, `label` | none |
| `components/primitives/icon.svelte` | `name`, `size`, `strokeWidth`, `label` | none (Lucide with glyph fallback) |

### Stores (Svelte 5 runes)

| Store | State |
|---|---|
| `stores/project.svelte.ts` | `status: idle · scanning · ready · error`, `project`, `progress`, `error`, `warning`, image blob cache |
| `stores/navigation.svelte.ts` | `activeView: document · modules · module`, `activeDocumentId`, `activeModuleNumber`, block and module expansion |
| `stores/reader.svelte.ts` | `modal` (row detail, document or image), `highlightedRowId` |
| `stores/tables.svelte.ts` | per-table `text`, `statuses` and `sort`, reset per document |

`stores/index.ts` re-exports them, so components import one module. There is no
preferences store: nothing is persisted (D-18).

## 3. Data

- No database and no migrations.
- Input: the folder source from CORE-03 (directory handles on a served origin,
  folder input from `file://`).
- Model: `Project` with documents, sections, tables and the reference index, all
  from CORE-02/04/08; the builder is `src/lib/project/build.ts`.
- Persistence: none. The appearance is fixed and the folder is chosen per session.
- Nothing is written back to the project folder.

## 4. Implementation

Core owns the shared packages (`src/lib/fs`, `src/lib/markdown`,
`src/lib/semantics`, `src/lib/model`, `src/lib/project`, `src/lib/i18n`,
`src/lib/format`); their boundaries are in
[`ARCHITECTURE.md`](../../ARCHITECTURE.md) §3 and
[`00-core/TECHNICAL.md`](../00-core/TECHNICAL.md). This module owns:

| Path | Responsibility |
|---|---|
| `src/views/` | Empty state and reading workspace, including the shell |
| `src/components/` | Feature components: navigation, document body, nodes, tables, reference modal, overview and module page |
| `src/stores/` | Project, navigation, reader and table state |
| `tests/` | Vitest suites and real-document fixtures read from the repository |

## 5. Interaction and behaviour

**Sidebar.** Fixed column of 18 rem next to the content, with its own vertical
scroll; it never moves with the document and is always visible. There is no
toggle, no hover opening and no closed state to restore from.

**Navigation.** Three levels at most: block, module and document. *Project* is a
fixed block: it has no chevron and always shows the main project documents,
indented under the block with a guide line, exactly like a module's documents.
*Modules* lists the modules that exist as a folder with at least
one Markdown document, sorted by number; an inventory entry without a folder is
ignored and a discovered folder appears even when the inventory omits it. Every
module starts collapsed and only the chevron next to its name expands or collapses
its documents. Selecting the name opens the module page. A module is titled with its
folder name (`00-core`, `01-structured-reader`); its state renders as a coloured
icon and the state label in the same colour, without tinting the module name.
Documents are labelled with their file name; when the same name repeats in the same
list, the label becomes the relative path so the folder is visible. The full path is
always the accessible title. *Other documents* collects everything without a
category and starts collapsed.

**Modules overview (D-24).** The *Modules* title is a destination: it switches the
main area to a table with the module folder, a wide module name, one backlog count
column per status used by any module backlog, and the state at the far right, shown
with icon, chip and colour; it marks the sidebar entry as current. All goes first
with the text colour; the status columns follow the status vocabulary order and
each uses its own status colour. `All` counts every entry, including unknown
statuses; a status column counts the entries with that status and shows `0` when the
module has none, so the columns are the same for every row. `backlogStatusKeys`
collects them once from every backlog table. Expansion moved to the chevron next to
the title. Selecting any document sets the view back to `document`.

**Aggregated backlog (01 FR-22).** Below the module table, the overview builds one
synthetic table with the backlog rows of every module whose status is `new` or
`in progress`, adding a Module column. `backlogSummary` clones each source cell and
keeps a target per row, so the row modal shows the real item and its document. The
table uses the normal text, status and sort controls.

**Module page (D-25).** A module title is also a destination: the main area shows
the module folder and name, its state icon and chip, and the tables of its
`BACKLOG.md`, rendered with the same table component, so search, status filters and
sorting work unchanged. The backlog starts with `implemented`, `discarded` and
`deferred` filtered out. Overview rows open the same page. A module without a
backlog document
or with an empty table shows a translated message. Selectors live in
`src/lib/model/selectors.ts` (`moduleByNumber`, `moduleDocuments`, `moduleBacklog`).

**Document.** The body renders the semantic node tree across the remaining width
with a compact type scale (14 px base, tighter margins and headings); there is no
outline and no right rail. Section headings keep their anchors, so links inside the
document still scroll.

**Document header (01 FR-17).** The parser reads the universal skeleton before lexing:
the four front-block fields, the `Status` token with its date and `Last update`
become typed metadata and those lines leave the body. The reader renders them in a
compact header under the title: a status chip, the dates and a two-column list of
`Purpose`, `Read when`, `Canonical for` and `Do not duplicate`. A document without
metadata keeps its blocks unchanged. Byte-order marks and CRLF are normalised before
parsing, so a heading is never mistaken for a paragraph.

**Reload.** The top-bar action calls `projectStore.reload()`: it re-walks the
directory source and rebuilds the project in place, keeping the selected document
when it still exists. With the folder-input source there is nothing to re-read, so
the model is rebuilt from the same snapshot; the limitation is documented in §7 and
in the requirements.

**Tables.** Cells are single-line with ellipsis; the table scrolls horizontally
when needed. Rows are focusable and clickable: a click that does not land on a
button or link opens the row detail modal with every column and the full text.
Every identifier inside a cell is split into its own reference run, including code
spans, so a cell with several identifiers offers one action per identifier and a
click never opens the row by accident. Status chips, text and status filters and
single-column sorting work as before. Filter chips reflect visibility: pressed
means the status is visible, struck means it is filtered out, and an empty
selection shows no rows. A table may declare excluded statuses for its initial
view; the module page uses that to hide `implemented`, `discarded` and `deferred`
until the user enables their chips. Reset clears the text, the status selection and the sort,
so every row becomes visible again.

**Identifier references.** The index collects table rows (first column), list
items and headings that start with an identifier. After parsing, a pass splits
every text, code and table run in headings, paragraphs, quotes, list items and
cells, turning each visible identifier into a `reference` run rendered as a
code-style button. The identifier that defines a heading, a list item or a
first-cell row is skipped at offset zero, and code blocks are never touched.

Resolution follows the document scope: a project document sees only project-level
definitions; a module document sees its own module first and the project level as a
fallback; `D-`, `CORE-` and `CR-` resolve from anywhere; an explicit `NN` prefix
narrows the search to that module, so `01 B-01` resolves the first backlog item of
module 1 from any document. Each reference keeps one canonical target: a global
identifier resolves to the project definition, and a heading or list-item
definition wins over a secondary table row such as an acceptance criterion.
Duplicates that remain inside that choice keep listing their candidates.

**Modals.** Row detail, document preview and image preview; focus trapped, closed
with `Esc` or the close action, focus returned to the opener. *Go to document*
closes the modal, navigates and highlights the target row.

**Keyboard.** Skip link, sidebar entries, table rows with `Enter`/`Space`,
filters and sortable headers, and the modal trap; visible focus throughout.

## 6. Tests and evidence

- Vitest, 92 tests across 11 suites: category mapping and module folders, module
  inventory, module selectors and backlog lookup, status vocabulary and detection,
  table filtering and sorting, reference index, scope resolution and duplicates,
  heading definitions (including the real requirements document), identifier
  references inside text and table cells, link resolution, i18n messages, parser and
  project builder, front-block metadata and `<br>` handling.
- Fixtures: the suites parse the real repository documents
  (`PROJECT_STATE.md`, `docs/DECISIONS.md`,
  `docs/modules/00-core/BACKLOG.md`), so the parser faces the real structure.
- Manual verification in Chrome (Vite development build) with a simulated folder
  source: 2026-11-13 — light-only interface with no theme control, fixed sidebar
  that stays in place with its own scroll and content starting after it, state icon
  plus state text, project documents indented, reload action that re-scans without
  asking for the folder, compact 14 px typography, three menu levels, repeated file
  names shown with their folder, one-line table rows opening the full row detail,
  an identifier inside a row opening its target without opening the row, an
  identifier in a module bullet opening the item modal of its definition (while
  the definition itself stays unlinked and unknown codes stay plain), and a clean
  console. Real folder
  permissions and the built artifact remain for the owner's verification.
- Visual pass (D-23): every navigation block, module, document, toolbar, modal and
  empty state shows its Lucide icon next to the text; 22 icons render as SVG in the
  development build, Inter is active, the built artifact loads both with SRI under
  the shipped CSP, and the console stays clean.
- Modules overview (D-24): clicking *Modules* shows the folder/name/state table for
  the three fixture modules and marks the sidebar entry as current; the chevron
  still expands the tree and selecting a document returns to its content.
- Module page (D-25): clicking the module title shows its folder, name, state and
  backlog table; searching reduced it to the expected rows, sorting reversed the
  order, the status chips filtered, and a module without a backlog showed the empty
  message. Overview rows open the same page.

## 7. Limits and known limitations

- Chromium-only environment.
- From `file://` the folder input replaces the directory picker (D-15).
- Permissions can be revoked at any time; the reader returns to the empty state
  with a message.
- Image previews hold blob URLs that are released when the project changes.
- The documentation lives in memory: changing a file on disk requires selecting
  the folder again.
- Identifiers are resolved only when the index knows them: a code with no
  definition, or one written inside a code block, stays plain text.
- Sorting is single-column by design (D-14); multi-column sorting is not
  implemented and is tracked as `01 B-01`.
- The folder-input path keeps a snapshot of the files: reload re-parses it but does
  not see later edits on disk.
- The interface is English only (D-16) and light only (D-18), and it persists no
  preferences.
- Without network, the icon bundle and Inter are unavailable: icons fall back to
  glyphs and the system font stack is used. The reader keeps working (D-22, D-23).

## 8. Implementation status

| # | Milestone | State |
|---|---|---|
| MS-01 | CORE-01 | Implemented |
| MS-02 | CORE-02 + CORE-03 | Implemented |
| MS-03 | CORE-04 + CORE-07 + CORE-08 | Implemented |
| MS-04 | CORE-05 + CORE-06 | Implemented |
| MS-05 | Reader UI, including revisions D-17 to D-25 | Implemented |
| MS-06 | Closure: owner verification against the requirements | Pending |

The numbers are those of the original milestones; only the prefix changed (`M1`…`M6` became `MS-01`…`MS-06` when the standard registered the namespace in v1.1).

## 10. Module-specific notes

### Approval record

D-14 records the approved implementation proposal. D-16 to D-25 record the
revisions requested by the owner after using the reader: single language, drawer
navigation, light-only appearance, the menu/layout revision, the fixed sidebar with
reload, identifier references in running text, the dependency allowlist, the icon
set, the modules overview and the module page. No open point remains from any of
them.
