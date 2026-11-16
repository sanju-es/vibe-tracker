# Module 5 — CHANGELOG

> Dated history only. No state, pending work or duplicated implementation logs.
**History:** append-only.

## 2026-11-16 — Closed as Tested

- The owner verified the magnifier, `Ctrl+K`, document index, results, excerpts,
  section jumps and table-row highlight in Edge.
- The module closes as `Tested` with every acceptance row verified; no open items.

## 2026-11-16 — Search query persistence

- The query moves to a session `search` store, so it survives leaving and returning to the search view; a project change clears it. `Ctrl+K` and the magnifier refocus the input, `Esc` works from any focus inside the view, and the no-results message is announced.
- No behaviour of the index or results changed beyond the fixes.

## 2026-11-16 — Search and index implemented

- The banner gains a magnifier and `Ctrl+K`; the search view shows the document index on an empty query and grouped results otherwise.
- `searchProject` covers headings, paragraphs, quotes, lists, tables, code and front-block fields; matching is exact after case/diacritic normalisation, with typed before/match/after excerpts.
- Result selection opens the source section and highlights a table row; the document index groups every document by kind.
- `npm run test` 141 tests across 15 suites; `check`, `lint`, `docs:check` and `build` green. The Edge check remains for the owner's verification.

## 2026-11-16 — Implementation proposal written

- Proposal recorded: banner magnifier and `Ctrl+K`, document index as the empty state, one result per matching block with excerpt and section, and source jump with table-row highlight. Exact phrase, case/diacritic insensitive.
- No code changed; the module waits for approval.

## 2026-11-16 — Analysis started

- The owner selected module 5; the module moves from `Pending` to `In analysis` as the global search and document index.
- Open decisions: entry point, result shape, document index and matching/ranking. No code changed.

## 2026-11-13 — Documentation audit

- The dependency block left `MODULE.md` §10: `REQUIREMENTS.md` §8 is its only home (AG-03, standard v1.1).

## 2026-11-13

- Module documentation created with status `Pending`.
- Analysis pending; no code change yet.
- Documentation standard, phase 4 (D-26): front block, canonical slots and the registered backlog table; no analysis or behaviour was added.
