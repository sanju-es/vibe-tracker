# Module 1 — CHANGELOG

> Dated history only. No state, pending work or duplicated implementation logs.
**History:** append-only.

## 2026-11-13 — Documentation audit

- Milestones renamed from `M1`…`M6` to `01 MS-01`…`01 MS-06`: the numbering is the original one and only the prefix changed (standard v1.1).
- Acceptance evidence corrected: four rows named test files that do not exist and now name the suites that cover them (`tests/build.test.ts`, `tests/pipeline.test.ts`, `tests/tables.test.ts`, `tests/references.test.ts`, `tests/inline-references.test.ts`).
- Validation identifiers recorded as `01 VAL-1`…`01 VAL-11`, numbered as before the `V-` → `VAL-` migration (D-26).
- Backlog: `01 B-02` and `01 B-03` registered from the post-adoption audit; they describe documentation defects, not behaviour.

## 2026-11-13

- Renamed from `Core Viewer` to `Structured Reader` after the scope was redefined:
  the app interprets structure instead of displaying Markdown.
- Analysis written: navigation by blocks and categories, chapters with a side
  outline, interactive tables with statuses, filters and sorting, and reference
  modals for rows, documents and images.
- Implementation proposal written (components, stores, table interactions, tests,
  milestones); at that stage it awaited the owner's approval and no code existed.
- Implementation delivered: semantic reader, block navigation, side outline,
  interactive tables with status chips, filters and sorting, row detail modal,
  document and image modals, theme switching.
- Folder access implemented with two adapters behind one interface (directory
  picker and folder input), recorded as D-15.
- Verification: `check`, `lint`, `test` (58 tests) and `build` green; the built
  `index.html` is self-contained and carries the approved CSP; a manual browser
  check with a simulated folder source exercised navigation, filters, modal and
  themes with no console errors. Real folder permissions and the built artifact
  remain for the owner's verification.
- Owner revision (D-16, D-17): interface reduced to English only; navigation moved
  to a hover-opening drawer with module folder names, state icons and section
  anchors; right outline removed; content fixed at 75 % of the window; tables
  render one line per row with truncated cells and every row opens its full detail
  in a modal.
- Verification of the revision: `check`, `lint`, `test` (55 tests) and `build`
  green; the browser check confirmed the drawer open/close and `inert` state,
  section jumps, single-line rows with truncation, row-detail modal and the `i`
  action. Owner acceptance of the revision is pending.
- Second owner revision (D-18, D-19): theme control, dark tokens and stored
  preferences removed; the drawer now stays open on selection; the menu reduced to
  three levels (block, module, document) with file names and the folder shown only
  when a name repeats; the document uses the full window width.
- Verification of the second revision: `check`, `lint`, `test` (55 tests) and
  `build` green; the browser check confirmed the light-only interface, full-width
  content, three menu levels, repeated names with their folder, module folder names
  with state icons and a drawer that stays open after selecting a document.
- Third owner revision (D-20): the drawer becomes a fixed sidebar with its own
  scroll and real layout space; typography compacted to a 14 px base; module state
  shown as icon plus text; project documents indented under their block; reload
  action added to the top bar.
- Verification of the third revision: `check`, `lint`, `test` (55 tests) and
  `build` green; the browser check confirmed the sidebar position and its own
  scroll, content starting after it, 14 px base, state text, nested project entries
  and a reload that re-scans without asking for the folder.
- Identifier references extended (D-21): list items that start with a code are
  indexed and every known code in running text becomes a reference that opens the
  defining item, with the definition itself left unlinked.
- Verification of the reference extension: `check`, `lint`, `test` (60 tests) and
  `build` green; the browser check confirmed a module bullet linking `D-02` to its
  item modal, the definition staying plain, an unknown code staying plain, and
  *Go to document* navigating to the target document.
- Visual redesign (D-23): Lucide icons (jsDelivr, SRI) in the header, navigation,
  tables, modals and empty state, Inter loaded with SRI through `FontFace`, new
  neutral palette and card surfaces, and glyph/system-font fallbacks.
- Verification of the redesign: `check`, `lint`, `test` (60 tests) and `build`
  green; 22 icons render as SVG, Inter is active, the built artifact loads both
  under the shipped CSP with SRI and a clean console, and no icon depends on the
  bundle thanks to its text labels and glyph fallback.
- Modules overview (D-24): the *Modules* block switches the main area to a table of
  folder, module and state; expansion stays on its own chevron.
- Verification of the overview: `check`, `lint`, `test` (62 tests) and `build`
  green; the browser check showed the three fixture modules with their folder,
  name and state chip, the block marked as current, and a document selection
  returning to the document view.
- Module page (D-25): each module opens a page with its backlog table, reusing the
  table component for search, status filters and sorting; overview rows open it too.
- Verification of the module page: `check`, `lint`, `test` (66 tests) and `build`
  green; the browser check showed the folder heading, the backlog table, a search
  that reduced it to one row, a sort that reversed the order and the empty message
  for a module without a backlog.
- Documentation standard, phase 3 (D-26): front block and canonical slots in
  `MODULE`, `REQUIREMENTS`, `TECHNICAL` and `BACKLOG`; `V-` renamed to `VAL-`;
  acceptance table added with every criterion `pending (owner)`; the backlog entry
  becomes `01 B-01` in the registered table shape; the app status vocabulary follows
  V-02 (`new`, `in progress`, `deferred`, `discarded`, `moved`) including the dated
  forms.
- Verification of the documentation phase: `node scripts/docs-audit.mjs
  --blocking-module 01` clean, `check`, `lint`, `test` (67 tests) and `build`
  green.
- Reader adapted to the documentation standard (01 FR-17, 01 FR-18): the universal
  front block, `Status` and `Last update` are parsed as typed metadata and rendered
  as a document header; `DOC-STANDARD.md` is categorised under *Project*; `<br>`
  renders as a line break; byte-order marks and CRLF are normalised. The old
  interpretations (front block as a quote, status as a paragraph, `<br>` as text)
  were removed.
- Verification of the adaptation: `check`, `lint`, `test` (72 tests) and `build`
  green; the audit stays clean.
- Owner review of the module views and references (01 FR-6, 01 FR-19, 01 FR-20):
  `tested` gets its own colour and icon; the overview widens the module column and
  moves the state to the far right; the sidebar labels use the state colour; every
  identifier in a table cell is an independent reference; a qualified `01 B-01`
  resolves the module 1 backlog item and renders as one clickable token; backlog
  tables start with `implemented` and `discarded` filtered out.
- Verification of the review: `check`, `lint`, `test` (79 tests) and `build`
  green; the audit stays clean.
- Second owner review of the module views (01 FR-20): modules start collapsed and
  only the chevron expands them; the active module keeps a neutral name with a
  single state colour; filter chips now mean "visible" and an empty selection shows
  no rows; identifiers inside code spans, including `Origin` cells with several
  codes, are independent references.
- Verification of the second review: `check`, `lint`, `test` (82 tests) and
  `build` green; the audit stays clean; browser check with a simulated folder.
- Third review: *Other documents* starts collapsed, and each reference keeps one
  canonical target (project definition for global identifiers, list item over
  secondary table rows) so the modal no longer offers glosses from other modules.
- Verification of the third review: `check`, `lint`, `test` (84 tests) and
  `build` green; the audit stays clean.
- Fourth review: the module overview adds an `(All / Open / Done)` backlog count
  before the state, `Other documents` starts collapsed, and reset clears every
  filter instead of restoring the initial status exclusion.
- Verification of the fourth review: `check`, `lint`, `test` (85 tests) and
  `build` green; the audit stays clean.
- Fifth review: the overview colours the All/Open/Done legend and values, modules
  without a local folder and at least one Markdown document are hidden from the
  sidebar and the overview, and the backlog default also hides `deferred`.
- Verification of the fifth review: `check`, `lint`, `test` (86 tests) and
  `build` green; the audit stays clean.
- Sixth review: the overview adds the aggregated backlog table for `new` and
  `in progress` items, the Project block becomes fixed and the module list only
  keeps folders with documents.
- Verification of the sixth review: `check`, `lint`, `test` (87 tests) and
  `build` green; the audit stays clean.
- Seventh review: the overview replaces the fixed All/Open/Done count with one
  column per status found in the module backlogs, in vocabulary order and in the
  status colours; every module shows its count per status or `0`.
- Verification of the seventh review: `check`, `lint`, `test` (88 tests) and
  `build` green; the audit stays clean.
