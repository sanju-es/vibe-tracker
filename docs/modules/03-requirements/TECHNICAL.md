# Module 3 — TECHNICAL

> **Purpose:** design, surface, data, implementation, tests and limits of the requirements catalogue.
> **Read when:** changing the module or reviewing its technical constraints.
> **Canonical for:** components, data, tests and limits of this module.
> **Do not duplicate:** requirements (`REQUIREMENTS.md`) and shared architecture (`docs/ARCHITECTURE.md`).

**Status:** `Tested` (2026-11-16)
**Last update:** 2026-11-16

---

## 1. Design and principles

- **One cross-module catalogue.** The reader still renders each document; this view collects the requirements items once, by module and section (D-13).
- **Source is the truth.** Every row keeps an `ItemTarget` to the defining heading or section, so the modal and *Go to document* never invent content.
- **Module state, not requirement state.** The status column is the owning module state; acceptance remains in `REQUIREMENTS.md` §9 and is not mixed into the catalogue (03 BR-3).
- **Explicit absence.** A module with no recorded items keeps one `No requirements recorded` row instead of disappearing.

## 2. Surface

No endpoints: the project has no own API. The proposal adds:

| Surface | Responsibility |
|---|---|
| `views/requirements-catalog.svelte` | Header, section/module grouping selector and shared table |
| `lib/model/requirements.ts` | Extract `RequirementsCatalog` from the parsed documents |
| `components/nodes/data-table.svelte` | Optional group order and `rowTarget` widened to any `RefTarget` |
| `stores/navigation.svelte.ts` | `requirements` active view and `openRequirements()` |
| `views/reading-workspace.svelte` | *Requirements* action in the top banner and catalogue branch |
| `lib/semantics/tables.ts` | Optional explicit group order in `groupRows` |

## 3. Data

`RequirementsCatalog` is a synthetic `Table` plus `Map<string, RefTarget>`:

- Columns: `Module`, `State`, `Section`, `ID`, `Text`; `statusColumn` is `State` (1).
- `Module` is the folder name (`01-structured-reader`); `State` is the module state literal; `Section` is `Functional requirements`, `Business rules`, `Flows`, `Validations` or `Edge cases`.
- `ID` is `FR-NN`, `BR-NN` or `VAL-NN`; flows and edge cases show `—`.
- `Text` keeps the full requirement text; the table truncates visually and the modal shows it in full.
- Each row target is an `ItemTarget` with the source document, section title, anchor and text.
- A module with `REQUIREMENTS.md` but no extracted items contributes one row with `Section` `—`, `ID` `—` and `Text` `No requirements recorded`; its target opens the document.
- Section order is fixed: functional requirements, business rules, flows, validations, edge cases.

## 4. Implementation

- `lib/model/requirements.ts`: walk each module's `REQUIREMENTS.md` nodes with the `## N.` slot context. Slot 2 contributes the `### FR-N — Title` headings plus their body paragraphs; slot 3 the `BR-N` list items; slot 4 the flow list items; slot 5 the `VAL-N` list items; slot 6 the edge-case list items. A missing section or item is not inferred.
- `lib/semantics/tables.ts`: `groupRows` accepts an optional `order` list; when present, group keys follow that order instead of the natural order. The status vocabulary order remains the default when grouping by the status column.
- `data-table.svelte`: the optional `groupBy` accepts `order`; `rowTarget` returns `RefTarget | null` instead of only `RowTarget`. Existing module 1 and module 2 callers keep returning `RowTarget` and their default path is unchanged.
- `navigation.svelte.ts` and `reading-workspace.svelte`: add the `requirements` view and the banner action next to *Backlog*; *Home* keeps using `reset(project)`.
- The catalogue view derives the catalogue with `requirementsCatalog(project, noRequirementsLabel)`, holds the grouping selector (`none`/`module`/`section`) and passes `groupBy` with the section order to `DataTable`.
- i18n: catalogue title, banner action, grouping labels, empty/no-recorded messages and an icon fallback.

**Impact on module 1.** `DataTable` gains an optional group order and a wider `rowTarget` return type. Both are additive; the default reader path, module 2 board and their tests keep working. The top banner gains one action.

## 5. Interaction and behaviour

**Opening the catalogue.** *Requirements* switches the main area to the catalogue and marks the action as current; the sidebar stays available. *Home* returns to `PROJECT_STATE.md`.

**Filters and grouping.** The shared filter bar searches every cell and toggles module-state chips; every state is visible initially. The group selector switches between a flat table, module groups and section groups. Section groups follow the requirements order; sorting applies inside each group.

**Row detail.** A click or `Enter` opens the shared modal with the item text; *Go to document* closes it, opens the source `REQUIREMENTS.md` and highlights the section or requirement heading. Group header rows are not interactive.

## 6. Tests and evidence

- `tests/requirements.test.ts`: FR headings with body text, BR/VAL list items, flows and edge cases without IDs, module state and folder, explicit no-requirements row, source targets and section order.
- `tests/tables.test.ts`: explicit group order and no mutation of source rows.
- `npm run test` on 2026-11-16: 132 tests across 14 suites, all green.
- `npm run check`, `npm run lint`, `npm run docs:check` and `npm run build` on 2026-11-16: all green; `dist/index.html` is 213.59 kB.
- Owner verification (2026-11-16): the catalogue was accepted and closed as `Tested`; every acceptance row in [`REQUIREMENTS.md`](REQUIREMENTS.md) §9 is `verified (2026-11-16)`. The browser check covered the banner action, filters, grouping, row detail and source jump.

## 7. Limits and known limitations

- The catalogue lists requirements, rules, flows, validations and edge cases; it does not show acceptance evidence or compute coverage (traceability is a different view).
- Single-column sorting, as in the rest of the application (D-14).
- No pagination: a very large catalogue renders every row, like the other tables.
- The catalogue is read-only and keeps no view state between sessions.
- Modules without `REQUIREMENTS.md` (module 0) contribute no rows; only their state, if any, is visible through the module inventory.
- The extractor reads `FR-N` from level-3 headings and list items under sections 3–6; a requirement written only as a bullet inside section 2 is not extracted.
