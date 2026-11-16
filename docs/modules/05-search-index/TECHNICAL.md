# Module 5 — TECHNICAL

> **Purpose:** design, surface, data, implementation, tests and limits of the search and index module.
> **Read when:** changing the module or reviewing its technical constraints.
> **Canonical for:** components, data, tests and limits of this module.
> **Do not duplicate:** requirements (`REQUIREMENTS.md`) and shared architecture (`docs/ARCHITECTURE.md`).

**Status:** `Tested` (2026-11-16)
**Last update:** 2026-11-16

---

## 1. Design and principles

- **Search the parsed model, not the raw files.** The project tree already holds every block, table cell and front-block field; search walks that tree and never sends text outside the browser (05 BR-1).
- **One result per text block.** A heading, paragraph, list item, table row or front-block field contributes at most one result; the excerpt keeps the first match.
- **Index and search share a view.** An empty query shows the document index; a non-empty query replaces it with the grouped results (05 FR-2 and 05 FR-3).
- **Navigate, do not duplicate.** A result delegates to the reader by document, anchor and optional row; the source document stays the only content surface.

## 2. Surface

No endpoints: the project has no own API. The proposal adds:

| Surface | Responsibility |
|---|---|
| `views/search-view.svelte` | Input, document index, grouped results and clear action |
| `lib/model/search.ts` | `searchProject(project, query)` and `documentIndex(project)` |
| `stores/navigation.svelte.ts` | `search` view, `openSearch()` and a pending anchor/row for source jumps |
| `views/reading-workspace.svelte` | Magnifier action in the top banner, search branch and anchor/row scroll effect |
| `lib/format/text.ts` | The same case/diacritic normalisation rules; the search adds a position map for the excerpt |

## 3. Data

`searchProject(project, query)` returns groups in this shape:

- `SearchGroup`: `{ documentId, documentTitle, category, moduleNumber, moduleFolder, matches }`.
- `SearchMatch`: `{ documentId, documentTitle, category, moduleNumber, moduleFolder, sectionTitle, anchor, rowId, kind, before, match, after }`.
- `kind`: `heading`, `body`, `table`, `front-block`.
- `anchor` is the matched heading or the nearest section anchor; `rowId` is present for a table row.
- Excerpts are split into before/match/after strings; no HTML.
- Groups follow the category order and document path; inside a document, heading matches come before body/table/front-block matches, then source position.

`documentIndex(project)` returns `{ category, documents }[]` in the same category order, with every document path and title. Module documents keep their category and module folder; *Other* is included.

Matching normalises the query and each text block with the existing accent/case normaliser. A small position map translates the normalised match back to the original string for the excerpt; query spaces are preserved as a phrase and a whitespace-only query is treated as empty.

## 4. Implementation

- `lib/model/search.ts` walks `project.documents` and their nodes with a section cursor. Headings, paragraphs, quotes, list items and code text contribute body matches; each table row is searched once through its cells and keeps the row id; front-block fields are searched separately.
- The search view under `src/views/` holds the query locally, focuses the input on mount and derives the index or the grouped results. `mark` around the match is rendered from the three excerpt strings, never from HTML.
- `navigation.svelte.ts` gains the `search` view, `openSearch()` and pending anchor/row state; `reading-workspace.svelte` gains the magnifier action, the search branch and an effect that scrolls to the pending anchor and highlights the pending row after the document renders.
- The banner magnifier is an icon-only button with an accessible label; `Ctrl+K` opens the view from the reading workspace, and `Esc` clears the query.
- i18n: search title, banner action, input placeholder, index labels, result section labels, empty/no-results messages and a Search icon fallback.

**Impact on module 1.** The top banner gains one action, the workspace gains one branch and `navigation` gains pending anchor/row state. The reader's document, table and reference behaviour are unchanged.

## 5. Interaction and behaviour

**Index.** Opening search without a query shows the document groups; selecting a document opens it at the top.

**Search.** Typing a phrase replaces the index with result groups. Each result shows its document, section and excerpt; the matching text is visually marked. Selecting it opens the source at the section and highlights a table row when present.

**Keyboard.** The input receives focus on open; `Ctrl+K` opens the view; `Esc` clears the query and returns the network-free index; every result is a button reachable with `Tab` and activated with `Enter`.

## 6. Tests and evidence

- `tests/search.test.ts`: index grouping and order, heading/body/list/table/front-block matches, case and accent normalisation, whitespace-only query, first-match excerpt, heading-before-body order, group order, row id and anchor targets.
- `npm run test` on 2026-11-16: 141 tests across 15 suites, all green.
- `npm run check`, `npm run lint`, `npm run docs:check` and `npm run build` on 2026-11-16: all green; `dist/index.html` is 222.89 kB.
- Owner verification in Edge on 2026-11-16: magnifier, `Ctrl+K`, index, results, excerpt, section jump and row highlight confirmed; the module is closed as `Tested`.

## 7. Limits and known limitations

- Exact phrase matching only; no fuzzy search, synonyms, stemming or ranking model (05 BR-3).
- The index is a flat list per category; it does not replace the sidebar or the module pages.
- No pagination: a very large project renders every matching block, like the other views.
- Search is read-only and keeps no query between sessions.
- Code text and front-block fields are searchable; non-text assets and external URLs are not.
