# DECISIONS.md — Project Tracking

> **Purpose:** decision log with approved, adopted-by-default and open items.
> **Read when:** questioning a technology, a convention or a piece of behaviour.
> **Canonical for:** the `D-NN` decisions, their dates and their reasons.
> **Do not duplicate:** requirements (`REQUIREMENTS.md`) and architecture detail (`ARCHITECTURE.md`).

**Last update:** 2026-11-13

---

## 1. Approved decisions

| # | Date | Decision | Context / reason |
|---|---|---|---|
| D-01 | 2026-11-13 | Cross-cutting: Stack: Vite + Svelte 5 + TypeScript, Tailwind CSS 4, compiled into one self-contained `index.html` with `vite-plugin-singlefile`. | The product must be portable, installable without permissions and usable offline; one HTML file is the simplest shareable artifact, and a small bundle matters. |
| D-02 | 2026-11-13 | Cross-cutting: Single application repository with layered code: `src/app → src/views → src/components → src/stores` and `src/lib`. Dependencies only point downwards. | One tool, one owner, no shared packages to justify a monorepo; the layering keeps the domain testable and separate from the UI. |
| D-03 | 2026-11-13 | Cross-cutting: No authentication and no permission model. The app reads local files only. | Internal tool that runs on each user's machine against their own copy of a project; there are no accounts, roles or shared data. |
| D-04 | 2026-11-13 | Cross-cutting: The Markdown files of the selected folder are the only source of truth, accessed read-only. `localStorage` keeps UI preferences only; there is no database. | The project documentation already lives in Markdown; duplicating it would create two truths. Read-only removes any risk of corrupting the owner's documents. |
| D-05 | 2026-11-13 | Cross-cutting: Working method: analysis → proposal → approval → implementation → closure, with the states `Pending`, `In analysis`, `Implementation proposal`, `In development`, `Implemented`, `Tested`, `Blocked`, and one active module at a time. | The owner approves behaviour before code is written, so scope and documentation stay honest. |
| D-06 | 2026-11-13 | Cross-cutting: Languages: code and comments in English, documentation in English, user-facing interface in Spanish and English. | English keeps the code and the docs shareable; both interface languages are required because the tool is distributed with projects that may be read by Spanish- or English-speaking users. |
| D-07 | 2026-11-13 | Cross-cutting: Git with a trunk-based workflow, one commit per closed task in Conventional Commits format, and the repository initialized in this folder without commits. | Small internal project, single maintainer path; per-task commits keep the history readable and reversible. |
| D-08 | 2026-11-13 | Cross-cutting: Native development environment (Node 18+ and npm). No Docker, no compose file, no `deploy/`. | There is no infrastructure to containerise: the deliverable is a static file and the only runtime dependency is a browser. |
| D-09 | 2026-11-13 | Cross-cutting: Security review layer disabled. The `quality-gate` still checks the network-free boundary, the content security policy and the dependency set. | The app has no auth, no users and no endpoints; a dedicated security backlog would carry no real findings. |
| D-10 | 2026-11-13 | Cross-cutting: Permanent Core container (module 0) for shared platform work: model, parsing pipeline, i18n, design tokens and the single-file build. | Those pieces are cross-cutting and would otherwise be duplicated or silently changed inside functional modules. |
| D-11 | 2026-11-13 | Module 01: Navigation by two always-visible collapsible blocks (*Project* and *Modules*) with categories derived from the file name; modules read from `PROJECT_STATE.md`; unclassified documents grouped under *Other documents*. Opening a project selects the project state document. | The user thinks in project areas and modules, not in folder paths, and every document must stay reachable even when its name is not known. |
| D-12 | 2026-11-13 | Module 01: The reader interprets structure instead of displaying Markdown: chapters with a side outline, tables as interactive data (status chips, text and status filters, column sorting) and row references resolved by exact identifier match with a detail modal. Links to another document, to an image or to an anchor of another document open in modals; an anchor inside the current document only scrolls. No HTML from the documents is injected into the page. | The value is understanding the project at a glance: recognising states and jumping to referenced items. Rendering semantic nodes also removes the `{@html}` risk. |
| D-13 | 2026-11-13 | Cross-cutting: Roadmap reshaped: module 1 becomes `Structured Reader` (was `Core Viewer`), module 2 becomes the aggregated backlog board across modules, and module 3 the aggregated requirements view. Per-table interaction stays in the reader. | Once the reader interprets tables, a separate per-table board would duplicate it; aggregation is the remaining distinct value. |
| D-14 | 2026-11-13 | Module 01: Implementation proposal for CORE-01 to CORE-08 and the reader approved as written: three-column layout, component surface, status column detected by header name only, single-column sorting, exact-match row references, and the content security policy of the artifact with `'unsafe-inline'` for the inlined script and style plus `connect-src 'none'`. | The owner approved the proposal; the CSP trade-off is acceptable because the page loads no third-party content and the no-network rule becomes browser-enforced. |
| D-15 | 2026-11-13 | Cross-cutting: Folder access uses the directory picker when the origin allows it and a folder input (`webkitdirectory`) when the page is opened from `file://`; both adapters implement one interface and the rest of the app is unaware of the difference. | Fixes the open question: a file opened from disk cannot use the picker, and the folder input works there without permissions. The read-only model is unchanged. |
| D-16 | 2026-11-13 | Cross-cutting: The interface ships in **English only**. The language selector, the locale store and the language preference are removed; `localStorage` keeps the theme only. Code and documentation remain English. | Owner request: a single interface language removes the translation surface and keeps the tool simpler. Supersedes the UI-language part of D-06; code and documentation languages are unchanged. |
| D-17 | 2026-11-13 | Module 01: Reader revision: navigation becomes a hover-opening drawer that keeps the content at 75 % of the window width; the right outline is removed; modules are titled with their folder name and show their state as an icon with the state as alternative text; every file lists its sections as anchors; tables render one line per row with truncated cells and any row opens its full detail in a modal. | Owner request after using the reader: more room for the document, less visual noise, and tables that stay readable while keeping the full text available in the detail modal. |
| D-18 | 2026-11-13 | Cross-cutting: The interface is **light only**. The theme switch, the dark tokens and the theme preference are removed; nothing is persisted in `localStorage`. | Owner request: one appearance removes a setting and a whole set of tokens. Supersedes the theme part of D-17 and the "light and dark" wording of the accessibility default. |
| D-19 | 2026-11-13 | Module 01: Menu and layout revision: selecting an option never closes the drawer; the menu has at most three levels (*Project*, *Module*, *Document*) and section anchors leave the menu; documents show their file name, with the folder added only when the same name repeats in the same list; the document uses the full window width. | Owner request after using the reader: the drawer closed on every section click, the fourth level made the tree deep, and the 75 % column left unused space. |
| D-20 | 2026-11-13 | Module 01: Navigation is a **fixed sidebar** with its own scroll: it stays visible and does not move with the document, and the content starts after it, so it occupies real layout space. Module state shows the icon **and** its text. Project documents are indented as children of *Project*. A reload action in the top bar re-scans the current folder without asking for it again. Typography is compacted (14 px base, tighter margins) so more content fits. | Owner request after using the drawer: a fixed menu is easier to reach, the drawer hid part of the document, and the previous type scale forced too much scrolling. The reload action avoids re-picking the folder after editing documents. |
| D-21 | 2026-11-13 | Module 01: **Identifiers are references anywhere in the text.** The index now also collects list items that start with an identifier (`01 FR-3 — …`, `01 BR-9 …`), and every occurrence of an indexed identifier inside running text renders as a reference that opens a modal with the defining item (table row or list item, with its document and section). The identifier that defines an item is not linked to itself, unknown codes stay plain text, and duplicates keep listing their candidates. | Owner request: identifiers are spread through the documents and reading a module forces the reader to hunt the definition elsewhere. Linking only table cells left most identifiers unreachable. |
| D-22 | 2026-11-13 | Cross-cutting: **External resources are allowed under a closed allowlist.** Icons, fonts, libraries or styles may come only from **jsDelivr, cdnjs, unpkg or Google Fonts**. Every reference pins an exact version and carries an `integrity` (SRI) hash, and the interface must stay usable if the asset fails, so no external resource may be essential to read the documents. The deliverable is still **one `index.html`**; the content security policy widens only the directive an asset needs and only to its host. Unknown, fragile or experimental CDNs stay forbidden. | Owner decision: the restriction changes but the single-file deliverable does not. The allowlist keeps supply-chain risk bounded, and pinning with SRI plus a fallback avoids an outage breaking a tool that must work on a machine with no network. Supersedes the "no CDN" wording of D-09, D-14 and the project rules. |
| D-23 | 2026-11-13 | Cross-cutting: **Visual redesign: clear and compact.** Neutral light surfaces with one blue accent, soft cards, a 14 px Inter base and Lucide line icons. Icons are loaded from jsDelivr (`lucide@1.72.0`, SRI) and the two Inter files from the same host (`@fontsource/inter@5.3.0`, SRI fetched before registering the font). Every icon is accompanied by text or an accessible name and falls back to a glyph; the system font stack replaces Inter if the asset fails. The CSP allows that host in `script-src`, `font-src` and `connect-src`. | Owner request to make the interface more intuitive and visual using the newly allowed resources. Text labels and glyph fallbacks keep the tool usable offline, as D-22 requires. |
| D-24 | 2026-11-13 | Module 01: Selecting the **Modules** block opens an overview page: a table with the module folder, its name and its state, with the sidebar entry marked as current. Expanding or collapsing the tree moves to a separate chevron button next to the block title, so navigation and expansion no longer compete for the same click. Selecting a document returns to the document view. | Owner request: the module block is a destination of its own, and a single click cannot both navigate and toggle the tree. |
| D-25 | 2026-11-13 | Module 01: Selecting a **module** opens its page: heading with the folder and name, its state chip, and the module's backlog table with the same search, status filters and sorting as any other table. Overview rows open the module page too, and a module without a backlog shows an explicit empty message. | Owner request: the module is a destination of its own and its backlog is the first thing worth reading there. Reusing the table component keeps one implementation of filter, search and sort. |
| D-26 | 2026-11-13 | Cross-cutting: **Documentation standard adopted and adapted** as `docs/DOC-STANDARD.md` v1.0, without creating artifacts the project does not have; the approved deviations are listed in the note below this table. | The owner asked to normalise what exists and to define the rest for future use, without creating empty artifacts. A closed standard prevents each module from inventing its own form, and the deviations keep the current single-file frontend project honest instead of importing backend-only rules. |
| D-27 | 2026-11-13 | Cross-cutting: **Documentation standard v1.1 approved**: the cited-and-missing rule is defined, the registry headings the document already used are accepted, the identifier padding is stated, `MS-NN` is registered with its lookup table, and two checks join the enforcement table, without renumbering any identifier. | The post-adoption audit showed the adopted standard contradicting itself and the artifacts in four places, and two classes of defect — a block copied into a second home and a code span naming a path that does not exist — with no check behind them. The owner approved the amendments as the closing act of the normalisation. |
| D-28 | 2026-11-13 | Cross-cutting: **Documentation standard v1.2 approved**: F-07 names the status line, the decisions table belongs to §1, §5.1–§5.4 become V-01–V-04, the `## 7. Decisions` index is registered, descriptive tables claim no order, T-05 covers the three history homes, G-12 dates a changeable state, AG-02 matches the quoted front block, §7.4 accepts the sibling paths of the front block, AG-09 follows `AGENTS.md`, a documentation defect gets a home, E-08, E-11, E-12 and E-18 state their real coverage, E-21 to E-26 are declared and the rules without a check name `docs-auditor`. | The adopted standard contradicted itself in twelve places: a rule pointed at the wrong slot, a registry entry named a table that does not exist, four vocabulary references pointed at sections never written, two rules had no defined scope and four checks promised more than the linter does. No identifier was renumbered and no dated entry was rewritten; the artifacts, the agent contracts and the new checks follow in separate approved steps. |

**D-26 deviations.** Local slot catalogue (`WORKFLOW` 8, `TECHNICAL` 8, `ARCHITECTURE` 10 frontend substitutions, `DECISIONS` slot 3 reserved and omitted); one-time identifier migration (`V-NN` → `VAL-NN`, `FR`/`BR` qualified outside their file, ranges with `…`, the single backlog entry becomes `01 B-01`); `CORE-NN` move to `00-core/BACKLOG.md`; backlog vocabulary `new`/`in progress`/`blocked`/`deferred`/`implemented`/`discarded` with the app status vocabulary updated in the same phase; acceptance table only from `Implemented`, risks table and `RISK-NN` reserved while limitations stay in `TECHNICAL` §7; agent and skill files exempt from the front block; `E-02` and `E-03` disabled until tags and a contract exist.

**Superseded clauses.** `D-04`'s `localStorage` clause and `D-06`'s interface-language clause are superseded by `D-16`; `D-16`'s theme clause by `D-18`; `D-17`'s 75 % content width by `D-19` and `D-20`; `D-19`'s full window width by `D-20`. The dated rows stay as written (T-05).

## 2. Adopted by default

> Accepted implicitly. **They are not confirmed requirements**; the owner has the
> final word.

| Item | Value in use | Why it may change |
|---|---|---|
| Markdown tokeniser | `marked` (lexer) plus own semantic pipeline | A different parser may be needed if the documents use syntax `marked` cannot tokenise reliably. |
| i18n mechanism | Own English dictionary in `src/lib/i18n` | A library may be worth it if more interface languages are ever approved (D-16 keeps one). |
| Accessibility target | WCAG 2.1 AA contrast on the light theme | The owner may ask for a different target; the single-theme decision is D-18. |
| Testing scope | Vitest unit tests over the domain layer | Component or end-to-end tests are only added if the owner asks for them. |
| Supported browsers | Chrome and Edge (Chromium) only | Supporting Firefox or Safari would require a different folder-access strategy. |
| Development port | 5173 (Vite default) | Only changes if the port conflicts with another local tool. |
| Table interaction state | Filters and sorting reset when the document changes | The owner may prefer to remember them per table during the session. |

## 4. Open questions

- **Last-folder memory.** Remembering the chosen folder across sessions needs
  IndexedDB. Decide whether it is worth it now that the access mechanism is
  settled (D-15).
- **Artifact identity.** Naming and versioning of the distributed HTML file
  (module 6).

## 5. Decision history

- **2026-11-13** — Project initialized. Decisions D-01 to D-10 recorded after the
  initial interview; no implementation code existed at that stage.
- **2026-11-13** — Module 1 analysis: D-11 (navigation), D-12 (semantic reading),
  D-13 (roadmap reshape) approved. The navigation open question is closed.
- **2026-11-13** — Implementation proposal approved (D-14) and the folder access
  mechanism settled with two adapters (D-15). CORE-01 to CORE-08 implemented with
  the reader; module 1 moves to `Implemented` pending the owner's verification.
- **2026-11-13** — Owner change request after using the reader: interface in
  English only (D-16) and the reader revision with drawer navigation, no outline,
  75 % content width and one-line clickable tables (D-17). Applied and verified;
  module 1 returns to `Implemented` pending acceptance.
- **2026-11-13** — Second owner revision: light-only interface (D-18) and the
  menu/layout revision with the drawer staying open, three levels, file-name
  labels and full-width content (D-19). Applied and verified; acceptance pending.
- **2026-11-13** — Third owner revision: menu becomes a fixed sidebar that occupies
  layout space, compact typography, module state text, nested project entries and a
  reload action (D-20). Applied and verified; acceptance pending.
- **2026-11-13** — Identifier references extended to running text and list items,
  so any known code opens the detail of the item that defines it (D-21). Applied
  and verified; acceptance pending.
- **2026-11-13** — External-resource policy changed (D-22): allowlisted CDNs
  (jsDelivr, cdnjs, unpkg, Google Fonts) with pinned versions and SRI, non-essential
  and with fallback, while the deliverable stays one `index.html`. At that stage the
  app still shipped no external asset.
- **2026-11-13** — Visual redesign (D-23): Lucide icons and Inter from jsDelivr with
  SRI, new neutral palette, soft cards, navigation/icon polish and glyph fallbacks.
  Applied and verified in development and in the built artifact.
- **2026-11-13** — The Modules block opens an overview table (folder, module, state)
  and keeps expansion on its own chevron (D-24). Applied and verified.
- **2026-11-13** — Each module opens its own page with its backlog table, filterable,
  searchable and sortable, and overview rows open that page (D-25). Applied and
  verified.
- **2026-11-13** — Documentation standard v1.0 adopted with the adaptations of D-26:
  local skeletons, reserved catalogue, identifier migration and enforcement plan.
  Applied to `docs/DOC-STANDARD.md`; no artifact was created.
- **2026-11-13** — Post-adoption audit of the standard against every artifact, and
  approval of v1.1 (D-27): the cited-and-missing rule defined, the headings the
  document already used accepted, the identifier padding stated, `MS-NN` registered,
  two checks added. The identifiers renamed keep their number; no identifier was
  renumbered.
- **2026-11-13** — Documentation standard v1.2 approved with D-28: the standard's own
  contradictions corrected, four checks realigned with the linter, six declared, the
  rules no check can decide named to `docs-auditor` and the agent contracts deferred.
  No identifier was renumbered.
