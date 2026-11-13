# Module 0 — TECHNICAL

> **Purpose:** surface, data, implementation, tests and limits of the shared platform.
> **Read when:** changing shared code or checking how a Core item is built.
> **Canonical for:** shared files, boot order, data pipeline, implementation design and work-item status.
> **Do not duplicate:** architecture detail (`docs/ARCHITECTURE.md`) and decisions (`docs/DECISIONS.md`).

**Status:** Active (permanent)
**Last update:** 2026-11-13

---

## 1. Design and principles

- **Link-first.** Architecture, decisions and the invariants live in their own
  documents; this file points to them instead of restating them.
- **One gateway for I/O.** Only `src/lib/fs` talks to the folder APIs; no layer
  above it performs I/O.
- **No shared mutable state below the stores.** The libraries return values; the
  stores own the application state.
- **Nodes, never HTML.** The pipeline returns typed nodes and the UI renders them.
- **One artifact.** The build inlines scripts and styles into a single
  `index.html`.
- **Closed network boundary.** Only the allowlisted, pinned and SRI-protected
  assets may load; all of them are optional (D-22).

## 2. Surface

The layer boundaries and the path of every package live in
[`ARCHITECTURE.md`](../../ARCHITECTURE.md) §3. Core owns the `src/lib` packages
(including `src/lib/project` and `src/lib/format`), the shared primitives under
`src/components/primitives`, `src/styles` and the build configuration. Functional
modules own their views, their feature components and their stores, and must not
duplicate what Core provides. Stores are Svelte 5 rune modules
(`src/stores/*.svelte.ts`) re-exported through `src/stores/index.ts`.

## 3. Data

### Boot order

1. Load the root component from `src/app`.
2. Render the initial view with the empty state and the folder-selection action.
3. On folder selection, hand the selection to `src/lib/fs`, build the semantic
   documentation in the stores and index the project.
4. Select the project state document and render the reading workspace.

### Data pipeline

The pipeline —from folder selection to rendered nodes— is documented once in
[`ARCHITECTURE.md`](../../ARCHITECTURE.md) §4. Two rules belong to Core and are
not repeated there: no layer above `src/lib/fs` performs I/O, and no layer below
the stores holds shared mutable state.

## 4. Implementation

Implemented. The design below is the one that shipped; deviations found while
building are recorded at the end of each section.

### 4.1 CORE-01 — Skeleton and single-file build

Files:

| File | Content |
|---|---|
| `package.json` | `type: module`; scripts `dev`, `build`, `preview`, `test`, `lint`, `format`, `check`; pinned dependencies |
| `vite.config.ts` | `@sveltejs/vite-plugin-svelte`, `@tailwindcss/vite`, `vite-plugin-singlefile`; build-only CSP injection plugin |
| `svelte.config.js` | Standard Svelte 5 configuration with TypeScript preprocessing |
| `tsconfig.json` | Strict mode, `noUncheckedIndexedAccess`, bundler resolution |
| `eslint.config.js` | Flat config with TypeScript and Svelte plugins |
| `.prettierrc` | Svelte-aware formatting |
| `index.html` | Root document; the build closes it into the single-file artifact |
| `src/app/main.ts` | Mounts the root component |
| `src/app/App.svelte` | Root component that chooses the empty state or the reading workspace |
| `src/styles/theme.css` | Tailwind entry with the `@theme` block (CORE-06) |

Build rules:

- `vite-plugin-singlefile` inlines JavaScript and CSS; `assetsInlineLimit` is
  raised so the whole bundle ends up in one file.
- A small inline Vite plugin adds the content security policy to the produced
  HTML **only in build mode**, so the development server keeps working.
- The build emits `dist/index.html` and nothing the page needs at runtime.

Content security policy for the artifact:

```text
default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net;
style-src 'unsafe-inline'; img-src 'self' data: blob:;
font-src 'self' https://cdn.jsdelivr.net;
connect-src https://cdn.jsdelivr.net; object-src 'none';
base-uri 'none'; form-action 'none'
```

`frame-ancestors` is deliberately absent: browsers ignore it when the policy is
delivered through a `<meta>` element, and it would only add a console error.

`'unsafe-inline'` is required because a single-file build inlines the script and
the stylesheet. The trade-off was approved in D-14: the artifact renders only nodes
produced by the parser.

**External assets (D-22, D-23).** The app currently loads two allowlisted assets,
both from jsDelivr and both pinned with SRI: the Lucide bundle (`script-src`) and two
Inter files. The fonts are not declared in CSS: `src/lib/fonts.ts` fetches each file
with its `integrity`, registers it through `FontFace` and silently leaves the system
stack in place if the fetch or the hash fails; that fetch is why `connect-src` names
the host. Icons are decorative: every one is paired with text or an accessible name
and falls back to a glyph if the bundle does not load.

The rules for any new external asset remain: pin the exact version, add SRI, widen
only the directive it needs and only to its host, provide a fallback and keep the
single-file deliverable (the HTML references the asset; it is never copied next to
it).

Verification: `npm run lint`, `npm run test` and `npm run build` green; `dist/`
contains one `index.html` with no runtime companion file; the policy is present
in the built HTML; every external reference has a pinned version and SRI.

### 4.2 CORE-02 — Semantic model

`src/lib/model/types.ts` (sketch, names final):

```ts
type Scope = "project" | "module";
type CategoryId =
  | "state" | "architecture" | "decisions" | "workflow" | "agents" | "readme"
  | "module-summary" | "requirements" | "technical" | "changelog" | "backlog"
  | "other";

interface Document {
  id: string;            // relative path, unique in the project
  path: string;
  title: string;
  scope: Scope;
  moduleNumber: number | null;
  category: CategoryId;
  nodes: Node[];
  sections: Section[];
  tables: Table[];
}

interface Project {
  name: string;
  documents: Document[];
  images: ImageAsset[];      // path plus load state, no bytes in the model
  index: ReferenceIndex;
}

interface Module { number: number; slug: string; name: string; state: string | null; }

interface ImageAsset { path: string; alt: string; documentId: string; }

interface Section { id: string; level: number; text: string; anchor: string; position: number; }

interface Table {
  id: string;                 // `${documentId}#table-${n}`
  headers: string[];
  rows: Row[];
  statusColumn: number | null;
}

interface Row { id: string; cells: Cell[]; }
interface Cell { column: number; text: string; inline: Inline[]; ref: RowReference | null; }
interface Status { value: string; key: StatusKey | null; }   // key null = neutral
interface RowReference { identifier: string; documentId: string; tableId: string; rowId: string; }
```

`Node` is a closed union of heading, paragraph, list, table, code, quote, image,
thematic break and `unknown` (carrying the original token type). The `unknown`
node exists so a future Markdown construct is visible instead of silently
dropped.

Pure helpers in `src/lib/model`:

- `categoryForFile(fileName, scope)` — the file-name map. Project: `PROJECT_STATE.md`
  → state, `README.md` → readme, `AGENTS.md` → agents, `ARCHITECTURE.md` →
  architecture, `DECISIONS.md` → decisions, `WORKFLOW.md` → workflow. Module:
  `MODULE.md` → module-summary, `REQUIREMENTS.md` → requirements, `TECHNICAL.md` →
  technical, `CHANGELOG.md` → changelog, `BACKLOG.md` → backlog. Anything else →
  other.
- `moduleInfoFromPath(path)` — parses `docs/modules/NN-slug/…` and returns the
  number and slug, or `null`.
- `buildProject` merges the inventory with the modules discovered in the folder:
  an inventory row without a local folder is ignored, and a folder with documents
  appears even when the inventory omits it.
- `backlogSummary` builds the aggregated `new`/`in progress` table for the overview
  and keeps a source target per synthetic row.

### 4.3 CORE-03 — Folder gateway

The mechanism was settled by D-15 after checking the platform: the directory
picker is skipped on `file://` and used on served origins. Both adapters live in
one module, `src/lib/fs/source.ts`, behind one interface:

```ts
interface FolderSource {
  name: string;
  entries: { path: string; kind: "markdown" | "image" | "other" }[];
  readText(path: string): Promise<string>;
  readBlob(path: string): Promise<Blob>;
}
```

- `sourceFromHandle` — wraps `showDirectoryPicker()` and walks directory handles;
  text and images are read lazily through the file handles.
- `pickWithInput` — wraps `<input type="file" webkitdirectory>`; files arrive in
  memory with `webkitRelativePath` and the first path segment (the folder name) is
  stripped.

Scan rules as implemented:

- Recursive walk of the directory handles; `node_modules`, `.git` and `dist` are
  skipped. The folder-input adapter does not filter folders.
- Case-insensitive `.md` detection; `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`,
  `.svg` and `.avif` are indexed as images.
- No depth or entry-count limit: the walk is eager, which is acceptable for
  documentation folders.
- Cancellation happens between file reads in the store, not inside the walk; the
  store reports progress as documents are read.
- The warning above 500 documents is computed in the store
  (`src/stores/project.svelte.ts`), not during the walk.
- Image blobs are created lazily, cached by path and revoked when the project is
  replaced.

### 4.4 CORE-04 — Markdown pipeline

- `marked.lexer(text)` gives block tokens; inline tokens are read from each
  block. No `marked.parse()` and no HTML string anywhere.
- Every block token maps to a `Node`; unknown types become `unknown` nodes.
- Inline tokens map to text, strong, em, code, link and image nodes. Raw HTML is
  kept as text and never injected.
- **Anchors:** slugify the heading text (lowercase, strip punctuation, spaces to
  `-`, keep non-ASCII letters), then de-duplicate with `-2`, `-3`. The anchor is
  prefixed with the document id only in the DOM, never in the model.
- **Link classification:** `#anchor` → anchor of the current document; relative
  path ending in `.md` → document; relative path ending in an image extension →
  image; `http(s):` or `mailto:` → external; anything else, or a target that is
  not in the project index → broken.
- Tables become `Table` values with header and body cells already split by the
  tokeniser.
- The pipeline normalises a leading byte-order mark and CRLF, reads the universal
  front block, `Status`, `Last update` and `History` as typed metadata and removes
  those lines from the body. `<br>` and Markdown hard breaks become `break` runs,
  never literal text.

### 4.5 CORE-05 — Messages

- `src/lib/i18n/keys.ts` — a literal union of keys; `en.ts` is the typed record,
  so a missing key is a type error.
- `src/lib/i18n/index.ts` — exports the dictionary, `t(key, values)` for
  interpolation and the label helpers.
- The interface is English only (D-16): there is no locale detection, no
  language switch and no language preference.
- Keys are grouped: `nav.*`, `category.*`, `table.*`, `status.*`, `modal.*`,
  `error.*`, `a11y.*`.
- No preference is stored: the light appearance is fixed (D-18) and the folder is
  chosen per session.
- Test: no message is empty and every key is namespaced.

### 4.6 CORE-06 — Tokens and primitives

- `@theme` tokens for colour, spacing, radius and typography; a single light
  palette under `:root` (D-18) with a compact base scale of 14 px (D-20) and the
  neutral surfaces, blue accent and soft radii of D-23.
- Inter is the display face, loaded with SRI and replaced by the system stack when
  it cannot be fetched; icons come from Lucide with a glyph fallback.
- Status colours are semantic tokens (`--pt-status-pending`,
  `--pt-status-active`, `--pt-status-blocked`, …), never raw palette values in
  components.
- Shared primitives: `modal` (focus trap, `Esc`, restored focus), `status-chip`
  (text plus colour, never colour alone), `module-status-icon` (per-state icon plus
  an accessible name), `icon` (Lucide wrapper with fallback) and `icon-button`
  (accessible name required). Domain-specific states such as the empty view live in
  the module that owns the flow.
- Verification: contrast measured against the target recorded in
  [`DECISIONS.md`](../../DECISIONS.md) §2 on the light theme; keyboard path of the
  modal reviewed.

### 4.7 CORE-07 — Table semantics

Status vocabulary, mapped to stable keys:

| Literal (case-insensitive) | Key |
|---|---|
| `Pending` | `pending` |
| `In analysis` | `in-analysis` |
| `Implementation proposal` | `implementation-proposal` |
| `In development` | `in-development` |
| `Implemented` | `implemented` |
| `Tested` | `tested` |
| `Blocked` | `blocked` |
| `Active`, `Active (permanent)` | `active` |
| `New` | `new` |
| `In progress` | `in-progress` |
| `Deferred` | `deferred` |
| `Discarded` | `discarded` |
| `Moved` | `moved` |
| `Implemented (YYYY-MM-DD)` | `implemented` |
| `Moved (<ID>, YYYY-MM-DD)` | `moved` |
| anything else | `null` (neutral chip with the literal text) |

- **Status column detection:** the header must match `status`, `estado` or
  `state`, case-insensitive. Without that header there is no status column: no
  heuristic over cell values, because guessing states would break the honesty
  rule.
- **Filter:** free text compared after lowercasing and removing diacritics, across
  every cell of the row; status filter is an inclusion set of keys plus `neutral`.
  `null` means no status restriction and an empty set means no visible rows.
- **Sort:** one active column at a time; ascending or descending; statuses sort by
  vocabulary order, numeric-looking cells numerically, the rest with
  `localeCompare` and `numeric: true`; empty cells always last; stable for equal
  values.

### 4.8 CORE-08 — Identifier index and references

- Indexed identifiers: the **first cell** of a table row and the **leading code**
  of a list item, both matching `^[A-Z]{1,5}-[0-9]{1,3}$` (`D-04`, `01 FR-3`,
  `CORE-08`, `CR-01`, `01 VAL-2`, `01 BR-6`).
- The index maps identifier → defining items: table rows (headers and cells) and
  list items (text, document and section). Duplicates are kept as a list and
  reported, never resolved silently.
- A table cell is a reference when its trimmed text equals an indexed identifier
  and it is not the identifier cell of its own row. Cells are also split into
  reference runs, including code spans, so several identifiers in one cell are
  independent targets.
- In running text, a pass splits text runs (headings, paragraphs, quotes and list
  items) and code spans, and turns every visible identifier into a `reference` run.
  The code that defines a list item is skipped at offset zero; code blocks are never
  scanned.
- Resolution is scope-aware: global `D-`, `CORE-` and `CR-` identifiers resolve
  anywhere; a module identifier resolves in its own module first and then at project
  level; a project document only sees project definitions; an explicit `NN` prefix
  narrows the search to that module (`01 B-01` is the module 1 backlog item). A
  global identifier keeps the project definition, and a list-item definition wins
  over a secondary table row.
- References are resolved after the whole project is parsed, so a reference may
  point forward to a document that appears later in the scan.
- Emitting the modal payload is the reader's job: the core only guarantees that a
  reference carries its targets.

## 6. Tests and evidence

- Commands: `npm run lint`, `npm run check`, `npm run test` and `npm run build`,
  run on 2026-11-13; all green.
- Suites: `tests/build.test.ts`, `tests/categories.test.ts`,
  `tests/links.test.ts`, `tests/pipeline.test.ts`, `tests/i18n.test.ts`,
  `tests/tables.test.ts`, `tests/status.test.ts`, `tests/references.test.ts` and
  `tests/inline-references.test.ts`.
- The suites parse the real repository documents, so the pipeline faces the
  structures the project actually uses.
- The browser check for the platform (icons, fonts, modal, statuses and
  references) is recorded in
  [`01-structured-reader/TECHNICAL.md`](../01-structured-reader/TECHNICAL.md) §6.

## 7. Limits and known limitations

| Limit or trade-off | Mitigation |
|---|---|
| The folder picker may not work from `file://` | Two adapters behind one interface (D-15); the origin check chooses one at runtime |
| `'unsafe-inline'` weakens the CSP | Approved in D-14 and justified in §4.1; `connect-src` still names only the allowlisted host (D-22) |
| An external asset fails or the machine is offline | Every CDN resource is pinned, has SRI and is non-essential: the interface keeps working without it (D-22) |
| `marked` token shapes change between majors | Pin the version and cover the pipeline with fixtures taken from the real documents |
| Large projects slow the first scan | Progress, cancellation and a warning threshold; parsing happens once per document |
| Blob URLs leaking memory | Cache keyed by path, revoked when the project is replaced and on unload |
| Status vocabulary drifting from the workflow | The vocabulary lives in one module and is covered by a test; unknown values stay neutral |

## 8. Implementation status

| ID | Item | State | Evidence |
|---|---|---|---|
| CORE-01 | Skeleton and single-file build | Implemented | `lint`, `test` and `build` green; `dist/index.html` is the only artifact and carries the CSP |
| CORE-02 | Semantic model | Implemented | `tests/build.test.ts`, `tests/categories.test.ts` |
| CORE-03 | Folder gateway | Implemented | `tests/links.test.ts` covers path resolution; real picker and folder-input permissions remain for the owner's verification |
| CORE-04 | Markdown pipeline | Implemented | `tests/pipeline.test.ts` and `tests/links.test.ts`, parsing real documents |
| CORE-05 | Message dictionary | Implemented | `tests/i18n.test.ts`; no preference is stored |
| CORE-06 | Tokens and primitives | Implemented | `src/styles/theme.css` and `src/components/primitives`; icons and font loaded with SRI in the browser check |
| CORE-07 | Table semantics | Implemented | `tests/tables.test.ts` and `tests/status.test.ts`; filters and sorting exercised in the browser check |
| CORE-08 | Identifier index | Implemented | `tests/references.test.ts`, `tests/inline-references.test.ts` and `tests/build.test.ts`; the item modal was exercised in the browser check |
