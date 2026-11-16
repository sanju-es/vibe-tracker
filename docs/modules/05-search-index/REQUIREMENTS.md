# Module 5 — REQUIREMENTS

> **Purpose:** functional requirements, rules and acceptance of the search and index module.
> **Read when:** verifying behaviour, judging a change or reopening the module.
> **Canonical for:** `FR-NN`, `BR-NN` and `VAL-NN` of this module.
> **Do not duplicate:** scope (`MODULE.md` §2) and implementation (`TECHNICAL.md`).

**Status:** `Tested` (2026-11-16)
**Last update:** 2026-11-16

---

## 1. Goal

Find any document, requirement, backlog item or decision by text, and move between related documents through the links they already contain.

## 2. Functional requirements

### FR-1 — Search entry

The top banner offers a magnifier action. Activating it opens the search view with the input focused; `Ctrl+K` opens it from anywhere in the reading workspace. *Home* returns to `PROJECT_STATE.md`.

### FR-2 — Document index

When the query is empty, the view shows the document index grouped by kind: project state, architecture, decisions, workflow, standard, agent rules, readme, module documents and other documents. Each entry shows the title and path; selecting it opens the document.

### FR-3 — Global search

A non-empty query searches every scanned Markdown document, not only the open one. The search covers headings, paragraphs, quotes, list items, table cells, code text and front-block fields, and ignores case and diacritics.

### FR-4 — Results

The view returns one result per matching text block, grouped by document. Each result shows the document, its kind or module, the section and an excerpt with the match. Heading matches come before body matches inside the same document; the order is deterministic.

### FR-5 — Navigate to the source

Selecting a result opens the source document at the matched section; a table result also highlights its row. The query remains available when returning to the search view until it is cleared or the project changes.

### FR-6 — Empty, no results and keyboard

An empty project shows an explicit empty state; a query with no matches shows an explicit no-results message. `Esc` clears the query, `Ctrl+K` focuses the search, and every result is reachable by keyboard.

## 3. Business rules

- **BR-1 — Local and read-only.** Search runs on the in-memory model, never sends text outside the browser and never changes a document.
- **BR-2 — Documents are the source of truth.** Only text present in the scanned Markdown is searchable; nothing is inferred or generated.
- **BR-3 — No fuzzy search.** Matching is an exact phrase after case and diacritic normalisation; there is no ranking model, synonym expansion or external service.
- **BR-4 — Typed excerpts.** Results carry before/match/after strings and never HTML; the view renders them as text.
- **BR-5 — The index is not navigation.** The document index is a complete, category-grouped list; the sidebar keeps its own navigation and the two do not replace each other.
- **BR-6 — No persistence.** The query and results live in memory for the session; nothing is stored between sessions (D-18).

## 4. Flows

1. **Open search.** Press the magnifier or `Ctrl+K` → the search view opens with the input focused and the document index visible.
2. **Browse the index.** Select a category group → pick a document → the document opens.
3. **Search.** Type a phrase → results replace the index, grouped by document, with excerpts and sections.
4. **Open a result.** Select a result → the source document opens at the section; a table result highlights its row.
5. **Clear.** Press `Esc` or the clear action → the query empties and the document index returns.

## 5. Validations

- **VAL-1** — Empty query: the document index is shown; no empty results panel.
- **VAL-2** — No match: an explicit no-results message with the query kept.
- **VAL-3** — Project without documents: explicit empty state, no index and no results.
- **VAL-4** — Query with accents or different case: matches the normalised source text.
- **VAL-5** — Table match: the result opens the section and highlights the row.
- **VAL-6** — Front-block match: the document opens at the top; no invented section.
- **VAL-7** — Several matches in one block: the result shows the first match and its excerpt.

## 6. Edge cases

- Query made only of spaces: treated as empty and shows the index.
- Query with punctuation or emoji: compared literally after normalisation; no regex interpretation.
- A document with only a title: its heading can match; body results are absent.
- A result in the already-open document: the view scrolls to the section and highlights the row when applicable.
- A project reload while the search view is open: the index and results recompute from the new project; a stale query is allowed.
- Very large result sets: no pagination in this module; the query and grouping keep the list reviewable.

## 8. Dependencies

- **Depends on:** module 1 (Structured Reader) for the reading workspace, navigation and the shared document renderer; modules 2 to 4 for the aggregated views that feed the index.
- **Shared code:** module 0 for folder access, scanning, the semantic model and the text normaliser.

## 9. Acceptance criteria

| FR | Criterion | Evidence | Status |
|---|---|---|---|
| FR-1 | The magnifier and `Ctrl+K` open the search view with the input focused; Home returns. | Manual browser check | verified (2026-11-16) |
| FR-2 | The empty-query view lists documents grouped by kind and opens each one. | `tests/search.test.ts`, manual browser check | verified (2026-11-16) |
| FR-3 | A query searches every document and covers text, tables and front block. | `tests/search.test.ts` | verified (2026-11-16) |
| FR-4 | Results are grouped by document with excerpt and section, headings first. | `tests/search.test.ts`, manual browser check | verified (2026-11-16) |
| FR-5 | A result opens the source section and highlights a table row. | `tests/search.test.ts`, manual browser check | verified (2026-11-16) |
| FR-6 | Empty, no-results, `Esc` and keyboard paths work. | `tests/search.test.ts`, manual browser check | verified (2026-11-16) |
