# Module 1 — REQUIREMENTS

> **Purpose:** functional requirements, rules, flows, validations, dependencies and acceptance of the reader.
> **Read when:** verifying behaviour, judging a change or reopening the module.
> **Canonical for:** `FR-NN`, `BR-NN` and `VAL-NN` of this module.
> **Do not duplicate:** scope (`MODULE.md` §2) and implementation (`TECHNICAL.md`).

**Status:** Implemented
**Last update:** 2026-11-13

---

## 1. Goal

Open a project folder and understand its state without reading raw Markdown: every
document reachable, every table filterable and sortable, every status recognisable
and every known identifier one action away from its definition.

## 2. Functional requirements

- **FR-1 — Select the project folder.** The user picks a folder; the app keeps it
  for the session. The mechanism is fixed by D-15 and must work from the
  distributed `index.html`.
- **FR-2 — Scan and index.** The app walks the folder recursively, collects `.md`
  documents and indexes the image files they reference.
- **FR-3 — Navigate with a fixed sidebar.** Two collapsible blocks, *Project* and
  *Modules*, in a sidebar that stays visible and does not move with the document;
  it has its own scroll when the tree is taller than the window. Modules are read
  from `PROJECT_STATE.md` and titled with their **folder names**
  (`00-core`, `01-structured-reader`); each shows its state as an **icon and the
  state in text**. Project documents are indented under *Project* like the
  documents of a module. Unclassified documents appear under *Other documents*. The
  menu has at most three levels: block, module and document.
- **FR-4 — Structured render.** Documents render from a semantic node tree:
  headings, paragraphs, lists, tables, code blocks, quotes, links and images. No
  HTML from the document is injected into the page.
- **FR-5 — Document identity in the menu.** A document is shown by its **file
  name**; when the same name appears more than once in the same list, its folder is
  added so the entries can be told apart. The full path is the accessible title.
- **FR-6 — Interactive tables.** Each table renders **one line per row** with
  truncated cells. A status column is recognised and painted with a colour and its
  literal text. The user can filter by free text, filter by status value, and sort
  by a column. Clicking anywhere in a row opens the **detail of that row** with
  every column and the full text. Every identifier inside a cell is a reference on
  its own: clicking it opens the item it defines, and a cell with several
  identifiers offers one action per identifier.
- **FR-7 — Reference modals.** A link to another `.md` document or to a local
  image opens a modal with the target content and a *Go to document* action. An
  anchor inside the current document scrolls without a modal.
- **FR-8 — Reading area.** The document starts to the right of the sidebar and
  uses the remaining width. The type scale is compact (14 px base) so more content
  fits on screen; there is no outline column.
- **FR-9 — Appearance.** The interface is **light only**; there is no theme switch.
- **FR-10 — No stored preferences.** The app keeps nothing between sessions.
- **FR-11 — Scan states.** Empty, loading (with progress and cancellation),
  success and error states exist for folder selection and scanning.
- **FR-12 — Reload.** A visible action in the top bar re-scans the current folder
  without asking for it again. With the folder-input path the files are the
  snapshot taken when the folder was chosen, so the reload rebuilds the model but
  does not see later edits on disk.
- **FR-13 — Keyboard and accessibility.** Complete keyboard path: sidebar entries,
  tables and modals; visible focus; skip-to-content link; modal closes with `Esc`
  and returns the focus to the element that opened it.
- **FR-14 — Identifier references.** Any identifier that exists in the project
  index (`D-04`, `CORE-08`, `CR-01`, `VAL-2`, …) is a reference wherever it appears
  in running text or in a list item, not only in a table cell. Activating one opens
  a modal with the defining item: its document, its section and its full text (or
  the table row detail). The identifier that defines an item is not linked to
  itself, unknown codes stay plain text, and identifiers inside code blocks are
  never linked.
- **FR-15 — Modules overview.** Selecting the *Modules* block opens a page with a
  table of every module: its folder, its name and its state. Expanding or collapsing
  the module tree is a separate control, and selecting a document returns to the
  document view.
- **FR-16 — Module backlog page.** Selecting a module opens its page: folder, name,
  state and its backlog table, which can be searched, filtered by status and sorted
  like any other table. A module without a backlog says so explicitly; the overview
  rows open the same page.
- **FR-17 — Document metadata.** A document that follows the universal skeleton
  shows its front-block fields, its `Status` token and its `Last update` as a header
  above the content. Those lines are removed from the body, so nothing is repeated.
  A document without metadata renders without the header.
- **FR-18 — Documentation standard and line breaks.** `DOC-STANDARD.md` appears
  under *Project* as *Documentation standard*, not under *Other documents*. `<br>`
  inside text or a table cell renders as a line break and is never shown literally.
- **FR-19 — Reference scope.** A project document resolves only project-level
  definitions. A module document resolves its own module first and falls back to
  the project level when the module has no definition. Global namespaces (`D-`,
  `CORE-`, `CR-`) resolve from any document. An explicit `NN` prefix narrows the
  search to that module: `01 B-01` is the first backlog item of module 1 from any
  document. Each reference resolves to one canonical item: a global identifier uses
  the project definition, and a list-item definition wins over a secondary table row
  such as an acceptance criterion.
- **FR-20 — Module overview and backlog defaults.** The overview keeps the module
  name column wide, shows one backlog count column per status found in any module
  backlog —in the status vocabulary order, each in its own status colour, with a
  leading **All** column in the text colour— and puts the state at the far right
  with icon, colour and label, using the same treatment in the sidebar. A module
  without entries of a status shows `0` in that column. A module backlog opens with
  `implemented`, `discarded` and `deferred` filtered out. Status chips show
  visibility: pressed means visible, struck means filtered out, and an empty
  selection shows no rows. Reset clears the text, the status selection and the sort.
  Modules start collapsed in the sidebar; only the chevron expands or collapses a
  module, and selecting its name opens the module page. The *Project* block is fixed
  and always shows the main project documents; *Other documents* starts collapsed.
- **FR-21 — Module visibility.** The sidebar and the overview list only modules that
  have a local folder with at least one Markdown document. A module named in
  `PROJECT_STATE.md` without a folder is ignored; a folder with documents appears
  even when the inventory omits it.
- **FR-22 — Aggregated backlog summary.** The modules overview adds a filterable
  table with the backlog items of every module whose status is `new` or
  `in progress` (accepted). Columns are Module, ID, Date, Type, Description, Origin,
  Priority and Status; opening a row shows the source item, and the table keeps the
  usual text, status and sort controls.

## 3. Business rules

- **BR-1 — Read-only.** The app never writes, renames, moves or deletes files in
  the project folder.
- **BR-2 — Local by default.** No document, image or metadata leaves the machine
  and the app makes no request of its own. Icons, fonts or libraries may come only
  from jsDelivr, cdnjs, unpkg or Google Fonts, pinned with an SRI hash and never
  essential for reading (D-22).
- **BR-3 — Documents are the source of truth.** The app never invents content,
  fills gaps or generates missing sections.
- **BR-4 — Nothing is hidden.** Any `.md` found is reachable: if it matches no
  category, it appears under *Other documents*.
- **BR-5 — Nothing is guessed.** A status outside the known vocabulary renders as
  neutral text; a reference that does not resolve gets no action.
- **BR-6 — Identifiers are exact.** A reference exists only for a code that
  matches the project index exactly; the identifier that defines an item is not
  linked to itself, and duplicates are reported instead of resolved silently.
- **BR-7 — Images belong to the project.** Only image files inside the selected
  folder are shown; anything else keeps its alternative text.
- **BR-8 — Default view.** Opening a project selects the project state document.
- **BR-9 — Truncation is visual only.** A table cell may be cut on screen, but the
  full text stays available in the row detail: no data is discarded.
- **BR-10 — One interface language.** All user-facing text is English; the
  documents keep the language they were written in.
- **BR-11 — Status icon is not colour-only.** The module state is conveyed by the
  icon's accessible name, not only by its colour.
- **BR-12 — One appearance.** The interface is light only; there is no dark theme
  and no setting to choose it.

## 4. Flows

1. **Open a project.** Start → empty state → choose folder → scan with progress →
   reading workspace and the project state document.
2. **Move around.** The sidebar is always visible: expand *Modules* → pick a module
   by its folder name → pick a document by its file name.
3. **Pick between repeated names.** When two entries in the same list share a file
   name, each one shows its folder; selecting one opens that document.
4. **Read a table.** Filter by text → filter by status → sort a column → click a
   row to read the full content in the modal → close with `Esc` or the close
   action.
5. **Open a reference.** Activate any known identifier in the text → a modal shows
   the defining item with its document and section; *Go to document* jumps there.
   In a table, clicking an identifier opens its target, and clicking anywhere else
   in the row opens that row's detail.
6. **Reload after editing.** Change a document on disk → press reload in the top
   bar → the project is scanned again with the same folder, keeping the selected
   document when it still exists.

## 5. Validations

- **VAL-1** — Unsupported browser: explain that the folder access needs Chrome or
  Edge, without breaking start-up.
- **VAL-2** — Selection cancelled or permission denied: return to the empty state
  with a message; the action stays available.
- **VAL-3** — Folder without `.md` files: empty state that says no documents were
  found and offers another folder.
- **VAL-4** — Unreadable document or image: report the error for that item only; the
  rest of the project stays usable.
- **VAL-5** — Missing image: render the alternative text plus a notice; the modal
  reports that the file cannot be shown.
- **VAL-6** — Unresolved reference: rendered as plain text with no action; a broken
  link shows an inline notice instead of navigating.
- **VAL-7** — Permission revoked while reading: return to the empty state with a
  message instead of failing silently.
- **VAL-8** — Duplicate identifier in the index: the modal lists the candidates with
  their documents.
- **VAL-9** — Two documents with the same file name in the same list: both entries
  show their folder and remain distinguishable.
- **VAL-10** — Reload without a folder chosen: falls back to asking for a folder;
  reload with revoked permission: the empty state explains and offers the action
  again.
- **VAL-11** — Unknown identifier or identifier inside a code block: rendered as
  plain text, with no action.

The numbers are those of the original document; only the prefix changed, from `V-` to `VAL-`, when the standard took effect (D-26, R-08).

## 6. Edge cases

- Very large folder or deeply nested structure: progress is shown and the scan can
  be cancelled; a warning appears above 500 documents.
- Filenames with accents, spaces or non-ASCII characters, and paths that are long
  or repeated in different folders.
- Documents with no sections: the document still renders; the menu has no section
  level, so nothing is missing from navigation.
- Tables without a status column, with a single column, or with ragged rows;
  cells too narrow to show any character are still reachable through the row
  detail.
- Row click on a cell that contains a button or a link: the control acts, the row
  detail does not open.
- The selected folder is not a project at all: documents without categories go to
  *Other documents*; the app does not fail.
- Reload after editing with the folder-input path: the snapshot cannot change, so
  the model is rebuilt with the same contents; the limitation is recorded in
  `TECHNICAL.md` §7.
- A code that appears in two places: the modal lists both candidates; the
  definition itself is never offered as its own reference.
- A code inside a code block or a fenced example: never linked, even if indexed.
- A document without a front block (README, changelog): it renders without the
  metadata header and keeps its first blockquote or paragraphs.
- A file that starts with a byte-order mark: the heading and the metadata are still
  parsed, not turned into a paragraph.
- Anchors that point outside the document, or to a chapter that no longer exists,
  are shown as broken and do not navigate.

## 8. Dependencies

- **Module 0 (Core):** CORE-01 to CORE-08 provide the build skeleton, the semantic
  model, folder access, the Markdown pipeline, i18n, design tokens, table semantics
  and the reference index.
- **Modules 2 to 6:** they build on this reader, its table component and its
  reference index.

## 9. Acceptance criteria

| FR | Criterion | Evidence | Status |
|---|---|---|---|
| FR-1 | A chosen folder loads its documents with either adapter. | Manual browser check | pending (owner) |
| FR-2 | The scan lists `.md` files and referenced images with progress. | `tests/build.test.ts`, manual browser check | pending (owner) |
| FR-3 | The fixed sidebar shows both blocks, state icon and text, and three levels at most. | Manual browser check | pending (owner) |
| FR-4 | Documents render from the node tree with no injected HTML. | `tests/pipeline.test.ts` | pending (owner) |
| FR-5 | Repeated file names in one list show their folder. | Manual browser check | pending (owner) |
| FR-6 | Tables filter, sort, truncate and open the row detail; each identifier in a cell opens its own target. | `tests/tables.test.ts`, `tests/references.test.ts` | pending (owner) |
| FR-7 | Document and image links open modals; anchors scroll without one. | Manual browser check | pending (owner) |
| FR-8 | Content starts after the sidebar, uses the remaining width and has no outline. | Manual browser check | pending (owner) |
| FR-9 | The interface is light only and offers no theme control. | Manual browser check | pending (owner) |
| FR-10 | Nothing is persisted between sessions. | Manual browser check | pending (owner) |
| FR-11 | Empty, loading, cancellation, success and error states exist. | Manual browser check | pending (owner) |
| FR-12 | Reload re-scans the current folder without asking again. | Manual browser check | pending (owner) |
| FR-13 | The keyboard path reaches sidebar, tables and modals; focus returns. | Manual browser check | pending (owner) |
| FR-14 | Known identifiers open their definition; definitions and code blocks stay plain. | `tests/references.test.ts`, `tests/inline-references.test.ts` | pending (owner) |
| FR-15 | The modules overview lists folder, name and state. | `tests/selectors.test.ts` | pending (owner) |
| FR-16 | A module page renders its backlog table with search, filters and sorting. | Manual browser check | pending (owner) |
| FR-17 | A document header shows the front block, status and last update; the body does not repeat them. | `tests/pipeline.test.ts` | pending (owner) |
| FR-18 | The standard sits under *Project* and `<br>` renders as a line break. | `tests/build.test.ts`, manual browser check | pending (owner) |
| FR-19 | Same-module resolution wins, project is the fallback, globals resolve anywhere and `NN` narrows the search (for example `01 B-01`). | `tests/references.test.ts` | pending (owner) |
| FR-20 | The overview shows a wide module column, one count column per backlog status found in the project plus **All**, coloured by status and `0` when a module has none, state at the right with icon and colour, and a backlog hides `implemented`, `discarded` and `deferred` by default. | `tests/selectors.test.ts`, manual browser check | pending (owner) |
| FR-21 | Only modules with a local folder and at least one Markdown document appear in the sidebar and the overview. | `tests/build.test.ts` | pending (owner) |
| FR-22 | The overview lists a filterable table of `new` and `in progress` backlog items with their source rows. | `tests/selectors.test.ts`, manual browser check | pending (owner) |
