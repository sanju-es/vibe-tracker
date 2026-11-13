# Module 0 — Core (cross-cutting platform)

> **Purpose:** own the shared platform layer and the cross-cutting work that belongs to no functional module.
> **Read when:** changing shared code, adding a dependency or reviewing an invariant.
> **Canonical for:** the boundary rule, the `CR-NN` invariants and the state of the `CORE-NN` work items.
> **Do not duplicate:** architecture detail (`docs/ARCHITECTURE.md`), decisions (`docs/DECISIONS.md`), work-item evidence (`TECHNICAL.md` §8) and work-item history (`CHANGELOG.md`).

**Status:** `Active (permanent)`
**Last update:** 2026-11-13

---

## 1. Purpose

Own the shared platform layer and the cross-cutting corrections that do not
belong to a functional module. Provide one place to track their scope, backlog,
state and history without duplicating the architecture or the decision log.

## 2. Scope

### In scope

- Typed domain model shared by every module (`src/lib/model`): project, document,
  section, table, row, cell, status, reference, category and scope.
- Markdown pipeline (`src/lib/markdown`): `marked` tokens to semantic nodes,
  heading anchors, inline typing and link classification. No HTML output.
- Table semantics (`src/lib/semantics`): status vocabulary, normalisation, filter
  and sort as pure functions.
- Project reference index (`src/lib/semantics`): row identifiers, exact-match
  resolution between documents and duplicate reporting.
- Folder and file access gateway (`src/lib/fs`): folder selection, recursive
  scan, text reading and image reading as local blobs. Only this layer talks to
  the browser's folder APIs.
- Single English message dictionary (`src/lib/i18n`); the interface ships in one
  language only (D-16).
- Design tokens, base styles and shared primitives such as modals, status chips,
  status icons, the Lucide icon wrapper and buttons (`src/styles`,
  `src/components/primitives`). The interface is light only (D-18) and uses Inter
  and Lucide from jsDelivr with SRI and fallbacks (D-23).
- Single-file build configuration (Vite plus `vite-plugin-singlefile`).

### Out of scope

- Functional screens, which belong to their module.
- The roadmap and any business rule of a specific view.

## 3. Boundary rule

A change in shared code that alters the observable behaviour of a functional
module requires:

1. the impact analysis of that module;
2. the owner's approval;
3. the module's documentation updated in the same task.

Module 0 is not a shortcut around the scope of a closed module.

## 4. Invariants (CR-NN)

| ID | Invariant | Source of truth |
|---|---|---|
| CR-01 | Folder access is read-only and happens only through `src/lib/fs`; no other layer touches the browser's folder APIs. | [`ARCHITECTURE.md`](../../ARCHITECTURE.md) §2 |
| CR-02 | No network beyond the allowlisted providers (jsDelivr, cdnjs, unpkg, Google Fonts, D-22); any external asset is pinned, carries SRI and has a fallback, so it is never essential. | [`ARCHITECTURE.md`](../../ARCHITECTURE.md) §2 |
| CR-03 | The pipeline returns semantic nodes with no HTML and no styling, and the UI renders them node by node. | [`ARCHITECTURE.md`](../../ARCHITECTURE.md) §2 |
| CR-04 | Every user-facing string comes from the message dictionary; components contain no literal interface text. | [`ARCHITECTURE.md`](../../ARCHITECTURE.md) §7 |
| CR-05 | The production build emits one self-contained `index.html`. | [`DECISIONS.md`](../../DECISIONS.md) D-01 |
| CR-06 | No new dependency without the owner's approval. | [`AGENTS.md`](../../../AGENTS.md) §4 |
| CR-07 | Status values are recognised only from the agreed vocabulary; anything else renders neutral with its literal text. | [`ARCHITECTURE.md`](../../ARCHITECTURE.md) §6 |
| CR-08 | A reference exists only for an identifier the index knows; the defining item is never linked to itself and the index reports duplicates instead of choosing one. | [`ARCHITECTURE.md`](../../ARCHITECTURE.md) §6 |

## 5. Delivered features

- Typed semantic model for projects, documents, sections, tables, rows, cells,
  statuses and references.
- Markdown-to-nodes pipeline with anchors, inline typing and link classification;
  no HTML output.
- Folder gateway with two adapters behind one interface and read-only access.
- English message dictionary with typed keys and interpolation.
- Design tokens and the shared primitives (modal, status chip, status icon, icon
  button, icon).
- Table semantics: vocabulary, status column, text and status filters and
  single-column sorting.
- Project reference index with exact resolution and duplicate reporting.
- Single-file build with a build-only content security policy.

## 6. Documentation map

- [`TECHNICAL.md`](TECHNICAL.md): surface, data, implementation, tests, limits and
  work-item status.
- [`BACKLOG.md`](BACKLOG.md): the `CORE-NN` work items and their state.
- [`CHANGELOG.md`](CHANGELOG.md): dated history.

## 7. Decisions

| Decision | Gloss |
|---|---|
| D-01 | Vite, Svelte 5 and TypeScript compiled into one self-contained `index.html`. |
| D-02 | Layered repository: `src/app`, `src/views`, `src/components`, `src/stores`, `src/lib`. |
| D-04 | Project Markdown is the only source of truth and is read-only. |
| D-14 | Approved implementation proposal for `CORE-01` to `CORE-08`. |
| D-15 | Two folder adapters behind one interface; the folder input covers `file://`. |
| D-16 | Interface in English only. |
| D-18 | Light-only appearance. |
| D-22 | Closed CDN allowlist with pinned versions, SRI and fallback. |
| D-23 | Lucide icons and Inter with local fallbacks. |

## 9. Next step

The container stays `Active (permanent)` and never closes as `Tested`; new
cross-cutting work becomes a `CORE-NN` entry in [`BACKLOG.md`](BACKLOG.md). The
owner chooses the next functional module.

## 10. Module-specific notes

### Lifecycle and state

- Module state: **Active (permanent)**. There is no `Tested` closure for the
  module as a whole.
- Each work item follows analysis → proposal → approval → implementation →
  verification. Verification evidence is recorded per item, never as a
  module-wide "tested" claim.
- Module 0 does not consume the active-module slot; the owner still chooses the
  next functional module.

### Verification

The browser check is recorded once, in
[`01-structured-reader/TECHNICAL.md`](../01-structured-reader/TECHNICAL.md) §6.
