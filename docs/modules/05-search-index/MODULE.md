# Module 5 — Search and Index

> **Purpose:** the search and index module of the reader.
> **Read when:** planning, analysing or closing this module.
> **Canonical for:** its scope, decisions and next step.
> **Do not duplicate:** requirements (`REQUIREMENTS.md`), implementation (`TECHNICAL.md`) and history (`CHANGELOG.md`).

**Status:** `Pending` (2026-11-13)
**Last update:** 2026-11-13

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

## 6. Documentation map

- [REQUIREMENTS.md](REQUIREMENTS.md): functional requirements, rules and acceptance.
- [TECHNICAL.md](TECHNICAL.md): design, surface, data, implementation, tests and limits.
- [CHANGELOG.md](CHANGELOG.md): dated history.
- [BACKLOG.md](BACKLOG.md): corrections and future work (only when reopening).

## 7. Decisions

| Decision | Gloss |
|---|---|

_not recorded._

## 9. Next step

Wait for the owner to select the module, then analyse it.

## 10. Module-specific notes

### Open points

- Search works on the in-memory model of the scanned folder; nothing is sent outside the browser.
- Relative links may point to images or files the app does not read; a broken link is reported, never invented.
- The search algorithm and ranking: `not recorded`.
