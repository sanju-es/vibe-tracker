# Module 0 — CHANGELOG

> Dated history only.
**History:** append-only.

## 2026-11-13 — Audit findings applied

- `CORE-09` to `CORE-16` implemented: the module dependencies point at Core, the `02`–`06` decision slots follow §7.3, `TECHNICAL` §1 and §7 no longer repeat one constraint, `README` loses its status marker and its extra rules, the build size and the platform limits keep one home, `.opencode/` joins the repository layout and the superseded clauses are listed in `DECISIONS.md`.
- The verification evidence of `CORE-01` to `CORE-08` lives in [`TECHNICAL.md`](TECHNICAL.md) §8; the earlier entry that sent it to `MODULE.md` §5 is superseded, not rewritten (T-05).
- `scripts/docs-audit.mjs` reads the `Status` token before its date, so the acceptance table stays required once the module files carry the date (G-12).
- `CORE-17` implemented: the four contracts of `.opencode` match the standard and the architecture —the two documented assets, `{@html}` without document content, the real fixtures, anchors checked, the five module files and module 0 without `REQUIREMENTS.md`— and each agent carries one H1 and a step budget that fits its review.
- `CORE-18` implemented: the linter enforces E-21 to E-26 (status shape, silence tokens, one separator, internal `§` references, agent H1, ranges) and completes E-08 and E-09 (the ten registered tables; state, status, type and priority), each one checked with a mutation that makes it fail.
- `CORE-19` implemented: the index also indexes a heading that starts with an identifier, and the defining heading is never linked to itself (D-29, `01 B-04`).

## 2026-11-13 — Documentation audit

- Work-item state has one home: `00-core/BACKLOG.md` §1. `TECHNICAL.md` §8 keeps the evidence and lost its `State` column (AG-03, standard v1.1).
- `.prettierrc` in the tool list corrected to the file that exists, `.prettierrc.json`.
- Backlog: `CORE-09`…`CORE-16` registered from the post-adoption audit; they describe documentation defects, not behaviour.

## 2026-11-13

- Cross-cutting container created as part of the project initialization.
- Scope and invariants recorded; no work item implemented yet.
- Scope extended after the module 1 analysis: semantic nodes instead of HTML,
  status vocabulary, table semantics and the project reference index.
- Work items CORE-01 to CORE-08 registered; at that stage all `Pending` and none
  implemented.
- Invariants CR-07 (status vocabulary) and CR-08 (exact reference matching) added;
  CR-03 now states that the UI renders nodes, never HTML.
- Implementation design written for CORE-01 to CORE-08 in
  [`TECHNICAL.md`](TECHNICAL.md) §4, including the CSP of the artifact, the folder
  adapter interface, the pipeline rules, the status vocabulary and the reference
  index. At that stage it awaited approval and nothing was implemented.
- CORE-01 to CORE-08 implemented with module 1: skeleton and single-file build,
  semantic model, folder gateway with two adapters, Markdown pipeline, English
  message dictionary and theme preference, design tokens and primitives, table
  semantics and the project reference index. All work items carry verification
  evidence in [`MODULE.md`](MODULE.md) §5.
- Message layer reduced to English only after D-16: the second dictionary, the
  locale detection and the language preference were removed. `module-status-icon`
  added to the primitives after D-17.
- Appearance reduced to light only after D-18: the theme store, the dark token set
  and the `localStorage` preference were removed. Message keys for the theme
  control deleted.
- Type scale compacted to a 14 px base and tighter heading, paragraph and table
  spacing after D-20.
- Identifier index extended after D-21: list items that start with a code are
  indexed, and a post-parse pass turns known identifiers in running text into
  reference runs with their defining item.
- Visual system renewed after D-23: neutral light palette, card surfaces, compact
  14 px Inter loaded with SRI, Lucide icon wrapper with glyph fallback and
  per-state module icons. The CSP now allows the jsDelivr host for the icon bundle,
  the fonts and the SRI font fetch.
- Model selectors added after D-25: module lookup, module documents and module
  backlog extraction (`moduleByNumber`, `moduleDocuments`, `moduleBacklog`).
- Documentation standard, phase 5 (D-26): front block, canonical slots with the
  Core substitutions (*Boundary rule*, *Invariants*), `CORE-01` to `CORE-08` moved
  to the registered backlog with their evidence in `TECHNICAL.md` §8, and the
  status vocabulary aligned with V-01 and V-02.
- Verification of the documentation phase: `node scripts/docs-audit.mjs
  --blocking` clean; `lint`, `check`, `test` (67 tests) and `build` green.
- Pipeline extended for the documentation standard: byte-order mark and CRLF
  normalisation, typed front-block/status/last-update/history metadata and real
  `break` runs for `<br>`; the old quote/paragraph interpretations were removed.
- Verification: `lint`, `check`, `test` (72 tests) and `build` green; the audit
  stays clean.
- References refined after the owner review: scope-aware resolution (module first,
  project fallback, global namespaces anywhere, `NN` qualifier), independent
  references for every identifier and code span inside a table cell, and `tested`
  moved to a distinct colour with its icon kept.
- Second review: status filtering is an inclusion set (`null` = all, empty = none),
  identifiers inside a code span are split individually, and paragraph or code-span
  references at offset zero are no longer skipped.
- Reference canonicalisation: a global identifier keeps the project definition and a
  list-item definition wins over a secondary table row, so one reference opens one
  item.
- Reset now clears the text, the status selection and the sort; the backlog count
  selector reports all, open and implemented entries per module.
- Module merging now keeps only modules discovered as folders with documents; an
  inventory row without a local folder is ignored.
- Aggregated backlog summary added to the selector layer: `new` and `in progress`
  rows from every module with a source target for the row modal.
