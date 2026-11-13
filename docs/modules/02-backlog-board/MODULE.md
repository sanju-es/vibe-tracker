# Module 2 — Backlog Board

> **Purpose:** the backlog board module of the reader.
> **Read when:** planning, analysing or closing this module.
> **Canonical for:** its scope, decisions and next step.
> **Do not duplicate:** requirements (`REQUIREMENTS.md`), implementation (`TECHNICAL.md`) and history (`CHANGELOG.md`).

**Status:** Pending
**Last update:** 2026-11-13

---

## 1. Purpose

Aggregate the backlog that lives inside every module document into one board, so pending work across the whole project can be reviewed together instead of module by module.

The reader already filters and sorts a table where it appears; this module adds the cross-document view: everything pending, grouped by module and status.

## 2. Scope

### In scope

- Collect backlog rows from every module `BACKLOG.md` found in the project.
- Present them in one board with global text and status filters.
- Group by module or by status, and sort by any column.
- Show the origin of each item and jump from the board to the source document with the row highlighted.
- Empty state when the project has no backlog items at all.

### Out of scope

- Per-table filtering and sorting inside a document: that belongs to the reader (module 1).
- Changing the status of an item or writing anything back to the Markdown files.
- Creating or deleting backlog items.
- Global text search across all documents (module 5).

## 6. Documentation map

- [REQUIREMENTS.md](REQUIREMENTS.md): functional requirements, rules and acceptance.
- [TECHNICAL.md](TECHNICAL.md): design, surface, data, implementation, tests and limits.
- [CHANGELOG.md](CHANGELOG.md): dated history.
- [BACKLOG.md](BACKLOG.md): corrections and future work (only when reopening).

## 7. Decisions

- The board is read-only: it visualises the documented state, it does not replace the document as the source of truth.
- Which columns and grouping the board offers is `Pending analysis`; nothing is implemented yet.

## 9. Next step

Wait for the owner to select the module, then analyse it.
