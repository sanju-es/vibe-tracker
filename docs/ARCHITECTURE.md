# ARCHITECTURE.md — Project Tracking

> **Purpose:** architecture and conventions of the single-client application.
> **Read when:** touching layers, data access, conventions or the build.
> **Canonical for:** code organization, data flow, data model, conventions and environments.
> **Do not duplicate:** decisions with alternatives (`docs/DECISIONS.md`) and module detail (`docs/modules/`).

**Last update:** 2026-11-13

---

## 1. System overview

Project Tracking is a **single-client application**: there is no backend, no
database and no API. The whole product is one Svelte 5 application compiled into
a self-contained `index.html`.

It is not a Markdown viewer. The application **interprets the documentation**:
it turns every document into a semantic tree —chapters, tables, statuses and
references— and renders that tree with interactive components.

The runtime flow is:

1. The user selects a project folder.
2. The scan layer walks the folder, reads the `.md` documents and the images they
   reference.
3. The Markdown layer converts tokens into semantic nodes; the semantics layer
   recognises statuses, normalises tables and builds the project reference index.
4. Stores hold the documentation, the index and the UI state.
5. Views render the semantic nodes: the fixed navigation sidebar, tables
   with filters and sorting, and modals for references.

The build inlines every script, stylesheet and dependency, so the artifact works
offline and can be copied as a single file. Any future external asset from the
allowlist is optional and must not be required to read the documentation.

## 2. Principles

- **The Markdown files are the source of truth.** The app reads and interprets
  them; it never writes to the project folder.
- **No network beyond the allowlist.** The app sends no telemetry and makes no
  request of its own. Icons, fonts, styles or libraries may come only from
  jsDelivr, cdnjs, unpkg or Google Fonts, pinned with an SRI hash, non-essential
  and with a fallback (D-22).
- **Semantic nodes, never HTML.** The pipeline produces typed nodes with no
  markup and no styling, and the UI renders them component by component. No
  document content reaches `{@html}`.
- **Nothing is guessed.** Statuses come from the agreed vocabulary; a reference
  exists only on an exact identifier match; unknown values are shown literally.
- **One way to reach the filesystem.** Every folder or file access goes through
  the filesystem layer; no component touches a browser folder API.
- **Dependencies only point downwards.** `app → views → components → stores/lib`.
  A lower layer never imports a higher one.
- **Small, approved dependency set.** Every dependency must be justified and
  approved, because it ends up inside the single-file bundle.
- **Accessibility and i18n are part of done**: WCAG 2.1 AA and both UI languages
  are verified on every screen.
- **Honest UI states.** Every surface that reads the folder has loading, empty,
  success and error states.

## 3. Code organization

```text
src/
├── app/                 # bootstrap, root component, global setup
├── views/               # screens: compose components and page state
├── components/          # feature components plus shared primitives
│   ├── primitives/      # modal, status chip and icon button (CORE-06)
│   └── nodes/           # one component per semantic node type
├── stores/              # Svelte 5 rune modules, re-exported by index.ts
├── styles/              # Tailwind entry point and design tokens
└── lib/
    ├── fs/              # folder selection, recursive scan, text and image reading
    ├── markdown/        # marked tokens to semantic nodes, anchors, link classification
    ├── semantics/       # statuses, table normalisation, filter/sort, project index
    ├── project/         # composition: documents into a Project (buildProject)
    ├── model/           # typed domain model, category map, inventory parser
    ├── i18n/            # English message dictionary and label helpers
    └── format/          # text normalisation and slugs shared by views
```

Rules:

- `views` own page state and composition; `components` receive props and emit
  events. A presentational component never reads the filesystem.
- `lib` is framework-agnostic where possible: pure functions and types that can
  be unit-tested without a DOM.
- `stores` is the only place with shared mutable state.
- Document rendering is a recursive walk over semantic nodes: each node type has
  one component, and unknown node types are reported instead of being rendered
  blindly.

## 4. Communication

There are no external services and no request/response contract. The internal
flow is:

```text
folder selection → lib/fs scan (text + images)
                 → lib/markdown tokens → semantic nodes
                 → lib/semantics statuses, tables, project index
                 → lib/project buildProject (documents, modules, references)
                 → stores → views → components (document, tables, modals)
```

- Data flows down through props; user intent flows up through events or store
  actions.
- Loading, progress and error information is carried in the store that owns the
  operation.
- No component calls a browser folder API, `fetch` or any other I/O.

## 5. Data layer

- **Source:** the folder the user selects. Access uses the directory picker when
  the origin allows it, and a folder input when the page is opened from disk
  (D-15); the rest of the app sees one interface.
- **Access:** read-only for text and for images, which are read as local blobs.
- **Scope:** the scan descends recursively, detects `.md` files and indexes the
  images referenced by documents. Other file types are not listed in navigation.
- **Persistence:** none. The appearance is fixed and nothing is stored between
  sessions (D-18).
- **No database and no migrations.** There is nothing to migrate and no data
  ownership outside the selected folder.

Limitations that come from the platform:

- Chromium browsers only, in a secure context.
- Access can be revoked by the user at any time; the app must recover with a
  clear message and a new selection.
- Images require blob URLs that must be released when the project changes.
- The documentation lives in memory: editing a file on disk requires selecting the
  folder again.

## 6. Data model

The model is plain TypeScript, defined by Core (D-10) and first used by module 1:

| Type | Purpose |
|---|---|
| `Project` | Selected folder: name, documents, modules, images and duplicate identifiers |
| `Document` | One Markdown file: relative path, title, category, scope, node tree |
| `Section` | Heading with level, text, stable anchor and position |
| `Table` | Headers, rows, detected status column |
| `Row` / `Cell` | Row cells with their column, typed content and optional reference |
| `Status` | Recognised vocabulary value or neutral literal |
| `CellReference` | Exact identifier match with the items that define it (table row or list item) |
| `RefTarget` | The defining item: a row (headers and cells) or a list item (text, document, section) |
| `Module` | Module number, slug, name and documented state |
| `Scope` / `Category` | Navigation blocks and the file-name category map |
| `ProjectError` | Translated error key plus the path involved, when any |

Rules:

- Every extractor returns one of these types; nothing in the model carries HTML
  or styling.
- The status vocabulary is closed; an unknown value is a neutral `Status` that
  keeps its literal text.
- Row references are exact: the index maps identifiers to defining items and
  reports duplicates instead of choosing one. Identifiers in running text become
  references when the index knows them; a definition never links to itself.

Field detail lives in the Core technical map
([`00-core/TECHNICAL.md`](modules/00-core/TECHNICAL.md) §4.2); the reader-specific
composition is in
[`01-structured-reader/TECHNICAL.md`](modules/01-structured-reader/TECHNICAL.md) §1.

## 7. Conventions

- **Languages:** code, comments and documentation in English; the interface ships
  in English only (D-16).
- **Files and folders:** English kebab-case (`module-card.svelte`,
  `backlog-item.ts`). Types in `PascalCase`, functions and variables in
  `camelCase`, constants in `UPPER_SNAKE_CASE`.
- **Types:** no `any`; public functions declare their return type.
- **Rendering:** one component per semantic node type; no `{@html}` with document
  content; unknown nodes produce a visible, translated notice.
- **i18n:** no hard-coded user-facing string; every message comes from the single
  dictionary and the interface stays English (D-16).
- **Styling:** Tailwind utilities plus shared tokens in `src/styles`; no one-off
  colours, spacing or font sizes. One light palette and one type scale (D-18,
  D-23).
- **Icons and type:** Lucide icons and Inter from jsDelivr with pinned versions and
  SRI; icons always carry text or an accessible name and both have a fallback
  (D-22, D-23).
- **Tables:** filtering and sorting live in pure functions; the component only
  renders the result. A status is always colour **and** text.
- **Accessibility:** native semantic elements first, labels on every control,
  keyboard path for every action, visible focus, contrast of at least 4.5:1 for
  text (WCAG 2.1 AA).
- **Errors:** user-facing messages come from the i18n dictionary and never leak
  stack traces or raw browser errors.
- **Tests:** one test file per domain module, fixtures taken from real project
  documents.

## 8. Repository layout

The layout implemented by module 1:

```text
project-tracking/
├── AGENTS.md
├── PROJECT_STATE.md
├── README.md
├── opencode.json
├── .gitignore
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── svelte.config.js
├── tsconfig.json
├── eslint.config.js
├── .prettierrc.json
├── index.html         # dev entry; the build emits dist/index.html
├── src/               # application code (see §3)
├── tests/             # unit tests; fixtures are real project documents
├── dist/              # build output (generated, not versioned)
├── scripts/
│   └── docs-audit.mjs # documentation linter
└── docs/
    ├── WORKFLOW.md
    ├── ARCHITECTURE.md
    ├── DECISIONS.md
    └── modules/
        ├── 00-core/
        ├── 01-structured-reader/ … 06-distribution/
```

## 9. Environments and operations

- **Development:** native environment with Node 18+ and npm. No Docker, no
  services to run.
- **Commands:** `npm run dev` (port 5173), `npm run check`, `npm run build`,
  `npm run preview`, `npm run test`, `npm run lint`.
- **Build:** Vite plus `vite-plugin-singlefile` produce one `index.html` at
  `dist/` (about 185 kB), with the content security policy injected in build mode.
  All code and CSS are inlined; the only remote references are the allowlisted
  Lucide bundle and Inter files, both with SRI (D-22, D-23).
- **Distribution:** the built file is copied and opened by the user. From
  `file://` the folder input is used; on a served origin the directory picker is
  available (D-15).
- **Environments:** there is no staging or production deployment. Each user runs
  the same artifact against their own local project folder.
- **No configuration variables** are required by the app.

## 10. Quality gates

- `npm run check` — `svelte-check` over the TypeScript and Svelte sources.
- `npm run lint` — ESLint and Prettier, no warnings accepted.
- `npm run test` — Vitest over the domain logic.
- `npm run build` — check plus single-file production build.
- `node scripts/docs-audit.mjs` — documentation must stay clean.
- The `quality-gate` agent reviews each closure; the `docs-auditor` reviews
  documentation-only changes.
