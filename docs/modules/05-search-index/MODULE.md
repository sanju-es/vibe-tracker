# Module 5 — Search and Index

> **Purpose:** the search and index module of the reader.
> **Read when:** planning, analysing or closing this module.
> **Canonical for:** its scope, decisions and next step.
> **Do not duplicate:** requirements (`REQUIREMENTS.md`), implementation (`TECHNICAL.md`) and history (`CHANGELOG.md`).

**Status:** `Tested` (2026-11-16)
**Last update:** 2026-11-16

---

## 1. Purpose

Make large projects navigable: find any document, requirement, backlog item or decision by text, and move between related documents through the links they already contain.

## 2. Scope

### In scope

- Global text search across the scanned Markdown documents, with the matching excerpt and its file.
- An index of documents grouped by kind (project state, workflow, architecture, decisions, modules).
- Navigate to a search result and to the documents linked from the current one.
- Empty, no-results and error states.

### Out of scope

- Semantic or fuzzy search with external models.
- Editing documents from a result.
- Searching outside the selected project folder.

## 3. Actors and screens

Single internal user, no accounts. The top banner offers a magnifier; it opens the
search view with the input focused. The view shows the document index when the
query is empty and the grouped results otherwise. A result opens the source
document at its section and highlights a table row when applicable.

## 4. Domain model

The view derives from the parsed model: every document, its headings, paragraphs,
lists, tables and front-block fields. Invariants: search is read-only and local;
an empty query returns no matches; one result per matching block; excerpts are
typed before/match/after strings; heading matches precede body matches; the
document index follows the category order.

## 5. Delivered features

- Banner magnifier and `Ctrl+K` entry.
- Document index grouped by kind when the query is empty.
- Global exact-phrase search across every scanned document, case and accent insensitive.
- Grouped results with excerpt, section and document, headings first.
- Source jump with anchor scroll and table-row highlight.

## 6. Documentation map

- [REQUIREMENTS.md](REQUIREMENTS.md): functional requirements, rules and acceptance.
- [TECHNICAL.md](TECHNICAL.md): design, surface, data, implementation, tests and limits.
- [CHANGELOG.md](CHANGELOG.md): dated history.
- [BACKLOG.md](BACKLOG.md): corrections and future work (only when reopening).

## 7. Decisions

| Decision | Gloss |
|---|---|
| D-34 | Search opens from the banner magnifier and `Ctrl+K`, with an empty-query document index and one result per matching block. |

## 9. Next step

Closed as `Tested` on 2026-11-16 after the owner's Edge verification; no open
items remain.

## 10. Module-specific notes

### Open points

- Search works on the in-memory model of the scanned folder; nothing is sent outside the browser.
- Relative links may point to images or files the app does not read; a broken link is reported, never invented.
- Entry point: magnifier in the top banner that opens the search view with a focused input; `Ctrl+K` opens it (owner, 2026-11-16).
- Result shape: one row per matching text block, grouped by document, with excerpt and section (owner, 2026-11-16).
- Document index grouped by kind is the empty-query state (owner, 2026-11-16).
- Matching: exact phrase after case and diacritic normalisation; no fuzzy search (owner, 2026-11-16).
- Navigation: document anchor plus table-row highlight; no modal in the search path.
