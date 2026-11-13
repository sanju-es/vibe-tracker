# Documentation standard — v1.1

> **Purpose:** single contract for the form of every Markdown file in Project Tracking.
> **Read when:** writing or reviewing documentation, or when `docs-audit` fails.
> **Canonical for:** file skeletons, table columns, vocabularies, identifier notation and the machine checks.
> **Do not duplicate:** the process ([WORKFLOW.md](WORKFLOW.md)) and the facts ([PROJECT_STATE.md](../PROJECT_STATE.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DECISIONS.md](DECISIONS.md), `docs/modules/`).

**Status:** `approved` (2026-11-13)
**Last update:** 2026-11-13

Every document follows one skeleton: front block, a two-sentence summary and numbered slots from a fixed catalogue. Enumerable facts live in declared tables and identifiers are namespaced; rules that cannot be checked are named to a reviewer.

v1.0 was approved with `D-26`; the v1.1 amendments below wait for the owner's approval.

---

## 1. Scope, authority and language

- **G-01 — Scope.** Applies to every `.md` under the repository root and `docs/**`, except `node_modules/` and `dist/`.
- **G-02 — Precedence.** [AGENTS.md](../AGENTS.md) (process) → this standard (form) → file-local notes. A file note never contradicts this document.
- **G-03 — Keywords.** **must** = gate failure; **should** = advisory, justified in the same task when skipped; **may** = free choice.
- **G-04 — Language.** English in every artifact (D-16). Owner statements stay verbatim inside quotes and established literals stay in code spans.
- **G-05 — Non-goals.** This standard creates no requirement, authorises no code and rewrites no dated entry.
- **G-06 — Adaptation.** Three buckets, decided in D-26: rules applied to existing artifacts, rules reserved for artifacts that do not exist yet, and rules not adopted. Section 8 records the three lists.

## 2. Rule identifiers

- **G-07 — Citation.** Every rule carries a prefix and a number: `G` general, `T` tables, `V` vocabularies, `R` references, `F` file skeletons, `L` lifecycle, `AG` agent, `E` enforcement.
- **G-08 — Use.** A review cites the rule instead of quoting prose: *"§7 repeats the scope — violates AG-03"*.
- **G-09 — Shape.** One rule is one sentence plus at most one inline example.

## 3. Universal skeleton

Every live document starts like this:

```markdown
# <Title from the file registry, §7>

> **Purpose:** one line.
> **Read when:** task triggers, short.
> **Canonical for:** the facts this file owns.
> **Do not duplicate:** where the rest lives.

**Status:** `Implemented` (2026-11-12)
**Last update:** 2026-11-13

Two sentences, at most 400 characters. No new facts, no identifiers created here.

---

## 1. First slot
```

- **G-10 — H1.** One H1 on the first line, exactly one of the patterns in §7.
- **G-11 — Front block.** The four `**Key:**` lines are mandatory on live documents; §7.9 lists the exceptions.
- **G-12 — Status.** `**Status:**` carries one token of the vocabulary that applies (§5) in backticks and the date in parentheses. It appears only on module files and on this standard.
- **G-13 — Summary.** At most two sentences and 400 characters, with no identifier created and no state claim beyond the status line.
- **G-14 — Sections.** `## N. Title`, consecutive from 1 within the catalogue of §7; `### Title` unnumbered for content subsections; `### N.M Title` only for the registry subsections of this document (§4.1, §7.1, §8.1 and their siblings); `####` forbidden. A slot may be omitted and keeps its number.
- **G-15 — Separator.** `---` once, between the front block and §1; further horizontal rules are forbidden. Fenced code blocks are examples and do not count.
- **G-16 — Dashes.** `—` (U+2014) in every H1 and in `## YYYY-MM-DD — Title`; `-` only inside compound words.
- **G-17 — Dates.** `YYYY-MM-DD` everywhere, including inside cells; a time only when the hour changes the meaning.
- **G-18 — Emphasis and code spans.** **Bold** only for status keywords and the operative sentence of a cell; `Code spans` for paths, identifiers, tokens and variables.
- **G-19 — Links.** Relative, never absolute or `file://`. Section links use the GitHub anchor of the heading and are validated (E-04).
- **G-20 — One fact per item.** An item that needs a second fact becomes two items.
- **G-21 — Length.** A table cell is at most 600 characters; beyond that, prose below the table reached by an anchor. The `Description` cell of a backlog entry is uncapped.
- **G-22 — Prohibited.** Emoji; HTML except `<br>` inside a cell; "see above" and "see below"; relative time without an absolute date; `TODO` or `TBD` as a value; rewriting a dated entry.
- **G-23 — Silence is explicit.** A missing fact is `not recorded`; an unapproved item is `pending (owner)`; blank or implied values are forbidden.

## 4. Tables

- **T-01 — Mechanics.** Header row, separator row `|---|` immediately after, no alignment colons, constant column count, no blank line inside, no nested table, no merged cell.
- **T-02 — Cells.** A phrase without a trailing period; a full sentence keeps its period. `|` inside a cell is escaped as `\|`, a line break is `<br>` and an empty value is `—`. The ID column is never bold.
- **T-03 — Order is contractual.** Each registered table declares its order in §4.1; an unordered table is a defect.
- **T-04 — One table per purpose.** Two tables with the same purpose in one file are merged.
- **T-05 — History tables are append-only.** A row is never edited or removed, only appended.

### 4.1 Table registry (active)

Descriptive tables that document this standard are not registered; they still follow T-01 and T-02.

| Table | File | Columns (exact) | Order | Closed values |
|---|---|---|---|---|
| Backlog entries | `*/BACKLOG.md` | `ID` · `Date` · `Type` · `Description` · `Origin` · `Priority` · `Status` | ID ascending | `B-NN` per module, `CORE-NN` in `00-core`; §5.2, §5.3, §5.4 |
| Decisions | `DECISIONS.md` §1, §2 | `#` · `Date` · `Decision` · `Context / reason` | ID ascending | `#` = `D-NN` |
| Core invariants | `00-core/MODULE.md` §4 | `ID` · `Invariant` · `Source of truth` | ID ascending | `CR-NN`; the source is a link |
| Milestones | `*/TECHNICAL.md` §8 | `#` · `Milestone` · `State` | ID ascending | `MS-NN` per module; §5.1 |
| Core work-item evidence | `00-core/TECHNICAL.md` §8 | `ID` · `Item` · `Evidence` | ID ascending | `CORE-NN`; the state stays in `00-core/BACKLOG.md` |
| Module inventory | `PROJECT_STATE.md` §6 | `#` · `Module` · `State` · `Open items` · `Documentation` | module number ascending | §5.1; `Open items` = identifiers only |
| Key-value facts | `PROJECT_STATE.md` §2 | `Key` · `Value` | semantic, stable | — |
| Acceptance | `*/REQUIREMENTS.md` §9 | `FR` · `Criterion` · `Evidence` · `Status` | FR ascending | `verified (YYYY-MM-DD)` or `pending (owner)`; required from `Implemented` |
| Standard history | this file §13 | `Date` · `Version` · `Change` | chronological | `vX.Y` |

### 4.2 Table registry (reserved)

Defined here, created only when the artifact exists (§8.2): contract history, contract errors, release notes, environment variables, accounts, services, glossary and risks. Their columns stay as in the source standard; the risk table uses `ID` · `Risk` · `Likelihood` · `Impact` · `Mitigation` · `Status` with `RISK-NN`.

## 5. Vocabularies

- **V-01 — Module states.** `Pending` · `In analysis` · `Implementation proposal` · `In development` · `Implemented` · `Tested` · `Blocked`, plus `Active (permanent)` for module 0. The inventory state cell holds one token.
- **V-02 — Backlog status.** `new` · `in progress` · `blocked` · `deferred` · `implemented (YYYY-MM-DD)` · `moved (<ID>, YYYY-MM-DD)` · `discarded`.
  - `new` — registered, not approved, not planned.
  - `in progress` — accepted and being worked.
  - `blocked` — waits on another item, named in the cell.
  - `deferred` — accepted, deliberately postponed behind a named milestone.
  - `implemented` — shipped; the date is mandatory and a tag is added only when releases exist.
  - `moved` — addressed outside the module that registered it.
  - `discarded` — rejected, with the reason in the cell.
  - **Migration mapping.** The old `Pending` maps to `new` and the old `Future` maps to `deferred` (D-26).
- **V-03 — Backlog type.** `correction` · `improvement` · `docs` · `test` · `tech-debt` · `performance`, optionally followed by ` / <second type>`.
- **V-04 — Priority.** `high` · `medium` · `low`. Severity for defects is reserved until a defect workflow exists.
- **V-05 — Decision scope.** A module decision opens its `Decision` cell with `Module NN:`; a cross-cutting one opens with `Cross-cutting:`. The `D-NN` stays global.
- **V-06 — Reserved.** Contract change class (`breaking` · `additive` · `errata`) applies only if an API appears.
- **V-07 — Document state.** `draft` · `proposed` · `approved` · `current` · `superseded` · `archived`; used by this standard and by future standards or plans.
- **V-08 — No synonyms.** One token per concept: `implemented` never `done` or `closed`; `Tested` never `Verified`. The module 0 state is `Active (permanent)` in full.

## 6. Identifiers and references

- **R-01 — Global namespaces.** `D-`, `CORE-` and `CR-` are unique repository-wide and never qualified; their number always has two digits (`D-07`). Reserved: `SEC-`, `DOC-`, `REL-`, `RISK-`, `DEF-`, `IMP-` and `NFR-`.
- **R-02 — Module namespaces.** `FR-`, `BR-`, `VAL-`, `MS-` and `B-` are per module. The bare form is allowed only inside the file that owns it; elsewhere it is qualified `NN <ID>`, for example `01 FR-3`. A family that came from the source documents keeps the number it already had (`FR-3`, `VAL-11`); a family created by this standard numbers with two digits (`B-01`, `MS-01`).
- **R-03 — Global files always qualify.** `PROJECT_STATE.md`, `DECISIONS.md`, `WORKFLOW.md`, `AGENTS.md`, `ARCHITECTURE.md` and this standard qualify every module ID.
- **R-04 — One meaning per file.** A bare token whose value exists in more than one module is forbidden in that file.
- **R-05 — No path notation.** `01/REQUIREMENTS.md FR-3` is written `01 FR-3`, optionally followed by a link.
- **R-06 — Link form.** The link text is the qualified ID and the target is the owning file; a table row has no anchor, so invented fragments are forbidden.
- **R-07 — Ranges.** `FR-1…FR-14` with U+2026, ascending, inclusive, one module and one prefix. Cross-module ranges are forbidden.
- **R-08 — Immutability.** An ID is never renumbered or reused. The one-time exception of D-26 renames `V-NN` to `VAL-NN` and the first backlog entry to `B-01` before the standard takes effect.
- **R-09 — Gaps.** Missing numbers in a sequence are legal and are not a defect.
- **R-10 — Legacy prefixes.** `V-` as a validation identifier is frozen after the migration: from then on `V-` means a rule of this standard only. `P-`, `DEF-`, `IMP-`, `A-`, `N-`, `I-`, `Q-` and `M-` are forbidden for new entries.
- **R-11 — History exemption.** `CHANGELOG.md` is append-only: never retro-normalised for R-02, R-05 or G-16; each new entry obeys them.
- **R-12 — External references resolve.** Paths exist, identifiers exist in their owning file and code spans name real modules, scripts or files.

### 6.1 Identifier lookup

| Prefix | Scope | Owner | Form outside the owner |
|---|---|---|---|
| `D-NN` | global | `docs/DECISIONS.md` §1 | never qualified; two digits |
| `CORE-NN` | global | `docs/modules/00-core/BACKLOG.md` | never qualified; two digits |
| `CR-NN` | global | `docs/modules/00-core/MODULE.md` §4 | never qualified; two digits |
| `FR-NN` | module | `REQUIREMENTS.md` §2 | `NN FR-N` |
| `BR-NN` | module | `REQUIREMENTS.md` §3 | `NN BR-N` |
| `VAL-NN` | module | `REQUIREMENTS.md` §5 | `NN VAL-N` |
| `MS-NN` | module | `TECHNICAL.md` §8 | `NN MS-NN` |
| `B-NN` | module | `BACKLOG.md` §1 | `NN B-NN` |
| `SEC-NN` · `RISK-NN` · `NFR-NN` · `DOC-NN` · `REL-NN` · `DEF-NN` · `IMP-NN` | reserved | §8.2, after its trigger | — |
| `G` · `T` · `V` · `R` · `F` · `L` · `AG` · `E` | this standard | this file | cited as rules, never as project references |

## 7. Canonical skeletons

- **F-01 — Fixed slots.** A file uses the numbered slots of its catalogue; an omitted slot keeps its number reserved.
- **F-02 — Clarifier.** A slot title may carry one parenthetical clarifier after the canonical title.
- **F-03 — Module-specific block.** Content that fits no slot goes to the last slot as `###` subsections.
- **F-04 — Front block.** Mandatory on live documents; the exceptions are listed in §7.9.
- **F-05 — Empty optional slot.** Omit it; write `_not applicable_` only when the absence is informative.
- **F-06 — Status line.** `**Status:** `Tested` (2026-11-13)`; the narrative follows as body text, never inside the token.
- **F-07 — History is not a state.** A `CHANGELOG.md` entry records what changed and when; the current state stays in `MODULE.md` §9 and pending work in `BACKLOG.md`.

### 7.1 Global files

| File | H1 | Required slots |
|---|---|---|
| `PROJECT_STATE.md` | `# PROJECT_STATE.md — Project Tracking` | 1 Project · 2 Stack and environment · 3 Architecture (one line) · 4 Way of working · 5 Quick links · 6 Module inventory and state · 7 Open problems and pending corrections · 8 Development credentials and data · 9 Next steps |
| `WORKFLOW.md` | `# WORKFLOW.md — Project Tracking (way of working)` | 1 Incremental development · 2 Per-module cycle · 3 Module states and lifecycle · 4 Change management · 5 Version control and commits · 6 Documentation honesty · 7 Documentation maintenance · 8 Definition of done and quality gates |
| `ARCHITECTURE.md` | `# ARCHITECTURE.md — Project Tracking` | 1 System overview · 2 Principles · 3 Code organization · 4 Communication · 5 Data layer · 6 Data model · 7 Conventions · 8 Repository layout · 9 Environments and operations · 10 Quality gates |
| `DECISIONS.md` | `# DECISIONS.md — Project Tracking` | 1 Approved decisions · 2 Adopted by default · 3 Conditioning design requirements (reserved) · 4 Open questions · 5 Decision history |
| `DOC-STANDARD.md` | `# Documentation standard — vX.Y` | 1 Scope, authority and language · 2 Rule identifiers · 3 Universal skeleton · 4 Tables · 5 Vocabularies · 6 Identifiers and references · 7 Canonical skeletons · 8 Lifecycle coverage · 9 Agent contract · 10 Enforcement · 11 Migration · 12 Governance · 13 Change history |

### 7.2 Process and agent files

| File | Required slots |
|---|---|
| `AGENTS.md` | 1 Onboarding · 2 Immediate rules · 3 Quality routing · 4 Project rules · 5 Documentation map · 6 Minimum documentation load |
| `.opencode/agents/*.md`, `.opencode/skills/*/SKILL.md` | Exempt from the front block and slots; they keep valid YAML frontmatter and one H1 per file |

### 7.3 `MODULE.md`

| Slot | Content |
|---|---|
| 1 Purpose | what the module is and why it exists |
| 2 Scope | `### In scope` and `### Out of scope` |
| 3 Actors and screens | who uses it, which screens |
| 4 Domain model | entities and invariants summary; detail in `TECHNICAL.md` |
| 5 Delivered features | implemented capabilities, one line each |
| 6 Documentation map | one line per sibling file |
| 7 Decisions | `D-NN` index with a one-line gloss each |
| 8 Risks and known limitations | risk table of §4.2 once a risk is registered; limitations stay in `TECHNICAL` §7 |
| 9 Next step | one line: state, blocker, decision needed |
| 10 Module-specific notes | free `###` block |

### 7.4 `REQUIREMENTS.md`

| Slot | Content |
|---|---|
| 1 Goal | one paragraph, business outcome |
| 2 Functional requirements | `### FR-NN — Title` groups |
| 3 Business rules | `BR-NN` |
| 4 Flows | numbered step lists |
| 5 Validations | rule and expected behaviour, `VAL-NN` |
| 6 Edge cases | expected behaviour |
| 7 Out of scope | **omitted by local decision**: the out-of-scope list lives once in `MODULE.md` §2 |
| 8 Dependencies | other modules, shared code |
| 9 Acceptance criteria | the acceptance table of §4.1; required from `Implemented` onwards |
| 10 Module-specific notes | free `###` block |

No implementation detail and no file paths in this file.

### 7.5 `TECHNICAL.md`

| Slot | Content |
|---|---|
| 1 Design and principles | decisions taken in this module, one line each |
| 2 Surface | components, stores, commands; no endpoints in a frontend-only project |
| 3 Data | sources, persistence and any migration statement |
| 4 Implementation | files and responsibilities |
| 5 Interaction and behaviour | flows that matter to the reader |
| 6 Tests and evidence | command, result, date |
| 7 Limits and known limitations | documented limits, one line each |
| 8 Implementation status | milestone table when the module was built in phases |
| 9 Risks | reserved: the risk table belongs to `MODULE.md` §8; omit this slot |
| 10 Module-specific notes | free `###` block |

### 7.6 `CHANGELOG.md`

```markdown
# Module NN — CHANGELOG
> **Purpose:** dated history. **Read when:** auditing what changed and why.
> **History:** append-only.
**Last update:** 2026-11-13

## 2026-11-13 — Short title
- **Change:** what changed, state before → after, evidence.
```

Newest first, one `##` per change or date, no state claims and no pending work (F-07).

### 7.7 `BACKLOG.md`

```markdown
# Module NN — BACKLOG (corrections and future work)
> **Purpose:** corrections and future work. **Read when:** reopening this module.
> **Not requirements.** Read only when reopening.
**Last update:** 2026-11-13

## 1. Entries
## 2. States
## 3. Types
## 4. Notes
```

- **F-08 — Self-containment.** `States` and `Types` repeat V-02 and V-03 with glosses, so a reader never needs this standard open.
- **F-09 — Core.** `00-core/BACKLOG.md` uses `CORE-NN` in the ID column; the module backlogs use `B-NN`.

### 7.8 Module 0 variant

Module 0 uses `MODULE.md`, `TECHNICAL.md`, `BACKLOG.md` and `CHANGELOG.md`, and no `REQUIREMENTS.md`. Its `MODULE.md` keeps the numbers with two substitutions: slot 3 is `Boundary rule` and slot 4 is `Invariants (CR-NN)`. `CORE-NN` are work items in `BACKLOG.md`; `CR-NN` are invariants in `MODULE.md`; the two namespaces are never mixed.

### 7.9 Exceptions and README

- `README.md` is an index: what the project is, how to run it and where the documentation lives. No front block and no registered table.
- `.opencode/agents/**` and `.opencode/skills/**` are exempt (§7.2).
- `CHANGELOG.md` needs the H1 and the `**History:** append-only` line; the rest of the front block is optional and dated content is never rewritten (R-11).

### 7.10 Reserved skeletons

Defined in §8.2, created only on trigger: `docs/plans/*`, `RELEASES.md`, `OPERATIONS.md`, `GLOSSARY.md`, `SECURITY-BACKLOG.md`, `api-contract.md` and `docs/user-guide/`.

## 8. Lifecycle coverage

- **L-01 — Every phase has a home.** A lifecycle fact with no home in §7 is registered here before it is written anywhere.
- **L-02 — No speculative artifacts.** A file is created only when its trigger occurs.

### 8.1 Coverage

| Phase | Artifact | Home | Status |
|---|---|---|---|
| Discovery | goal and scope | `MODULE.md` §1–2 | present |
| Requirements | FR, BR, flows, validations | `REQUIREMENTS.md` | present |
| Requirements | assumptions and open questions | `DECISIONS.md` §4 | present |
| Design | architecture and conventions | `ARCHITECTURE.md` | present |
| Design | decisions and alternatives | `DECISIONS.md` | present |
| Planning | roadmap and states | `PROJECT_STATE.md` §6 | present |
| Planning | risks | `MODULE.md` §8 | reserved until a risk is registered |
| Implementation | work log | `CHANGELOG.md` | present |
| Implementation | debt and pending work | `BACKLOG.md` | present |
| Verification | test strategy and evidence | `ARCHITECTURE.md` §10, `TECHNICAL.md` §6, acceptance table | present |
| Release | release notes and tags | `RELEASES.md` | reserved until the first tag |
| Deployment and operations | runbook, environment, incidents | `OPERATIONS.md` | not applicable to a static file, reserved |
| Security | threat baseline and backlog | `SECURITY-BACKLOG.md` | reserved while D-09 keeps the layer off |
| Knowledge | onboarding and documentation map | `README.md`, `AGENTS.md` | present |
| Knowledge | plans and user guide | `docs/plans/`, `docs/user-guide/` | reserved |

### 8.2 Reserved artifacts

| Artifact | Trigger | Skeleton |
|---|---|---|
| `SECURITY-BACKLOG.md` | the security layer is enabled | §7 style of the source standard, entries `SEC-NN` |
| `api-contract.md` | the project stops being frontend-only | contract slots of the source standard |
| `RELEASES.md` | the first tag | release notes table of §4.2 |
| `OPERATIONS.md` | a deployment or shared environment appears | environment, accounts and services tables |
| `GLOSSARY.md` | a synonym or ambiguous name appears | glossary table of §4.2 |
| `docs/plans/*` | a formal multi-phase plan is approved | plan slots of the source standard |
| `docs/user-guide/` | real usage outside the owner | user manual, deferred |
| Risk table and `RISK-NN` | a module registers a risk | risk table of §4.2 |
| `NFR-NN` | a measurable non-functional target is agreed | `ARCHITECTURE.md` §10 |

### 8.3 Not adopted

Backend, database and migration tables; contract and error tables; accounts, services and environment variables; obligation to tag every implementation; Spanish legacy values; the audit namespaces `D-`/`M-`; and the release tag inside V-02. Each is excluded because this project is a single-file frontend with no server, no users and no releases yet.

## 9. Agent contract

- **AG-01 — Front block is the index.** An agent decides whether to open a file from `Purpose` and `Read when` alone.
- **AG-02 — Fixed marker keys.** `**Purpose:**`, `**Read when:**`, `**Canonical for:**`, `**Do not duplicate:**`, `**Status:**`, `**Last update:**`, `**History:**`; bold, at line start, always spelled this way.
- **AG-03 — Single canonical owner.** A fact has one home; other files link to it.
- **AG-04 — No anaphora.** Every item names its subject; no "this", "the previous one" or "it" across a line boundary.
- **AG-05 — Absolute dates.** A date is written in full.
- **AG-06 — Deterministic anchors.** Heading text is unique per file and free of punctuation variants, so the slug is computable and validated (E-04).
- **AG-07 — Tables for facts, prose for reasons.** No table row without a stable key column.
- **AG-08 — Explicit absence.** `not recorded` or `pending (owner)`; nothing blank.
- **AG-09 — Bounded onboarding.** A module task reads `PROJECT_STATE.md` §6, its own `MODULE.md` and its `REQUIREMENTS.md`; other modules are not read.
- **AG-10 — Where does this fact go?**

| The fact is… | Home |
|---|---|
| a capability the owner wants | `REQUIREMENTS.md`, `FR-NN` |
| how something is implemented | `TECHNICAL.md` |
| a cross-cutting convention | `ARCHITECTURE.md` §7 |
| a decision with alternatives | `DECISIONS.md`, `D-NN` |
| what happened on a date | `CHANGELOG.md` |
| pending work or a defect | `BACKLOG.md`, `B-NN` or `CORE-NN` |
| a shared or core issue | `00-core/BACKLOG.md`, `CORE-NN` |
| the global state and index | `PROJECT_STATE.md` §6 |
| a reserved artifact | §8.2, after its trigger |

- **AG-11 — Citable rules.** A finding cites the rule ID (G-08).

## 10. Enforcement

`scripts/docs-audit.mjs` keeps its current validations and adds the rules below. A `must` exits non-zero; a `should` prints a warning.

| # | Check | Rule | Severity | State |
|---|---|---|---|---|
| E-01 | local links resolve | G-19 | must | active |
| E-02 | version tag equals the last release | — | must | reserved until tags |
| E-03 | contract header equals its last history row | — | must | reserved until an API |
| E-04 | anchors resolve: heading slug computed and compared | G-19, AG-06 | must | active |
| E-05 | H1 matches the file registry | G-10, F-01 | must | active |
| E-06 | front-block keys present and spelled as in AG-02; a `CHANGELOG` also carries `**History:** append-only` | G-11, AG-02, §7.9 | must | active |
| E-07 | required slots present and ascending, no renumbering | F-01 | must | active |
| E-08 | registered table headers match §4.1 | T-01 | must | active |
| E-09 | status, type and priority come from §5 | V-08 | must | active |
| E-10 | dates are `YYYY-MM-DD` in `Date` and `Last update` | G-17 | must | active |
| E-11 | qualified module IDs exist in the owning module, global IDs are never qualified and use two digits, ranges expand | R-01, R-02, R-07 | must | active |
| E-12 | no bare ID with two owners in one file | R-04 | must | active |
| E-13 | legacy identifier prefixes `P-`, `DEF-`, `IMP-`, `A-`, `N-`, `I-`, `Q-` and `M-` appear nowhere | R-10 | must | active; `V-NN` is a rule id after the migration |
| E-14 | no empty cell and no unescaped `\|` | T-02 | must | active |
| E-15 | cell length within G-21 | G-21 | should | active |
| E-16 | `Last update` not older than the newest `CHANGELOG` date | G-11 | should | active |
| E-17 | no Spanish stopwords in `docs/**` | G-04 | should | active |
| E-18 | `--json` yields `{files, links, failures:[{file, line, rule, severity, message}], summary}` | AG-08 | must | active |
| E-19 | no prose block is duplicated between a global document and a module, or between the files of one module (`CHANGELOG.md` and `.opencode/**` excluded; two different modules are not compared) | AG-03, T-04 | must | active |
| E-20 | a code span that names a path under `src/`, `docs/`, `tests/`, `scripts/` or the repository root resolves | R-12 | must | active |

The rules added for this standard are **blocking by default**: any `must` finding fails the command, and `--advisory` reports without failing. `--blocking-module NN` restricts enforcement to one module; the historical validations stay blocking at all times.

## 11. Migration

| Phase | Work | Effort |
|---|---|---|
| 0 | Approve D-26; adapt this standard: buckets, registries, baseline | 45 min |
| 1 | Extend `docs-audit.mjs` with the active checks, warnings and `--json`; measure the baseline | 2 h |
| 2 | Global files: front block, slots, one `---`, dates, inventory with `Open items`, decision scope prefixes | 1 session |
| 3 | Module 1 pilot: 10 + 10 + 8 slots, acceptance table, `B-01`, `VAL-` rename, qualified references; blocking enabled for that module | 1 session |
| 4 | Modules 2–6: front block, slots, backlog vocabulary; no invented analysis | 2–3 sessions |
| 5 | Core (`CORE-NN` to backlog) and agent files (front block or exemption) | 1 session |
| 6 | Every `must` blocking; re-measure and compare | 30 min |

**Structural baseline (2026-11-13, before phase 1):** 45 Markdown files; 85 relative links, all resolving; 0 placeholders; 39 tables; 7 backlog tables in the old shape; 0 acceptance tables; 0 of 45 files with the full front block; 11 with `Status` and 11 with `Last update`; 29 standalone `---` (4 files with one, 34 with none, 6 with more than one); identifiers `D` 159 · `CORE` 43 · `CR` 13 · `FR` 20 · `BR` 15 · `V` 13; 0 commits and 0 tags.

**Advisory baseline (2026-11-13, after extending the linter):** 276 findings over 8 rules — `E-06` 132, `E-07` 127, `E-08` 8, `E-12` 5, `E-05` 1, `E-09` 1, `E-13` 1, `E-15` 1. `E-01`, `E-04`, `E-10`, `E-11`, `E-14`, `E-16` and `E-17` report no finding, and the 90 relative links plus their anchors resolve. At that time the command ran in advisory mode and exited 0.

**Phase 2 checkpoint (2026-11-13):** 226 findings — `E-06` 108, `E-07` 106, `E-08` 7, `E-12` 3, `E-09` 1, `E-13` 1. The five global documents report no finding: front block, canonical slots, a single `---`, dates, inventory with `Open items` and decision scope prefixes are in place.

**Phase 3 checkpoint (2026-11-13):** module 1 reports no finding with `--blocking-module 01`. `MODULE` uses slots 1–7 and 9, `REQUIREMENTS` slots 1–6 and 8–9, `TECHNICAL` slots 1–8 and 10, and `BACKLOG` the registered table with `B-01`; `VAL-` replaces `V-` and the acceptance table is in place. Total: 232 findings — `E-07` 130, `E-06` 92, `E-08` 6, `E-12` 4 — all in modules 2–6 and the Core examples.

**Phase 4 checkpoint (2026-11-13):** modules 2–6 normalized without adding analysis: front block, slots 1–2, 6–7, 9–10 in `MODULE`; 1–3, 6 and 8 in `REQUIREMENTS` (acceptance omitted while `Pending`, now conditional in the linter); 1–4, 6–7 in `TECHNICAL`; registered backlog table with empty entries plus the state and type glosses. Total: 29 findings, all in `00-core` — `E-07` 14, `E-06` 12, `E-12` 2, `E-08` 1.

**Phase 5 checkpoint (2026-11-13):** `00-core` normalized: front block, slots with *Boundary rule* and *Invariants (CR-NN)*, the eight `CORE-NN` items moved to the registered backlog with `implemented (2026-11-13)`, evidence kept in `TECHNICAL.md` §8, and the status vocabulary aligned with V-01/V-02. Agent and skill files stay exempt. The audit reports **0 findings** over 45 files and 81 links, and `--blocking` exits 0. Every module from 1 to 6 and every global document is clean.

**Phase 6 checkpoint (2026-11-13):** the linter is blocking by default; `--advisory` only reports and `--blocking-module NN` restricts enforcement during a migration. The full audit reports **0 findings** over 45 files and 81 links, exits 0, and the migration is complete. Adoption of the standard is closed.

**Post-adoption audit (2026-11-13):** a second pass over every artifact against this standard found what the migration could not see from inside itself: `F-07` was cited by §7.6 and never defined; `G-14` forbade the `### N.M` headings this document already used; the padding that separates `B-01` from `FR-3` was undefined; `M1`…`M6` was an unregistered namespace; four acceptance rows named test files that do not exist; five modules declared their dependencies in two places; `PROJECT_STATE.md` §7 carried a limitation copied from the reader; the Core work-item state had two homes; and `WORKFLOW.md` §7 still listed dependencies and limitations under `MODULE.md`. Fixed in v1.1 and in the artifacts, without renaming any identifier except the `M-` prefix: `MS-NN` registered, evidence corrected against the real suites, the dependency block left `MODULE.md`, the limitation kept one home, the Core state kept only in `00-core/BACKLOG.md`, E-19 and E-20 added and E-11 extended to the global namespaces. The audit reports **0 findings** over 45 files and 85 links. v1.0 is the approved text (`D-26`); the v1.1 amendments are applied and wait for the owner's approval, and the first commit of the repository is still the owner's decision.

## 12. Governance

- **L-03 — Change of the standard.** A new or amended rule is a row in §13 plus a `DECISIONS.md` entry when it is architectural; the owner approves.
- **L-04 — No smuggled requirements.** This standard defines form only.
- **L-05 — Uncheckable rules name a reviewer.** A rule that cannot be automated states who reviews it at closure or is removed.
- **L-06 — Self-application.** This file follows its own skeleton, including the registry and the reference rules.

## 13. Change history

| Date | Version | Change |
|---|---|---|
| 2026-11-13 | v1.0 | First adapted version: local skeletons and table registry, active and reserved vocabularies, namespace rules with the `V-` → `VAL-` migration, reserved artifacts, active and reserved checks, baseline and phases. Approved with D-26. |
| 2026-11-13 | v1.1 | Audit of the adopted standard against the artifacts: F-07 defined (it was cited by §7.6 and missing from §7), G-14 accepts the `### N.M` registry headings the document already used, R-01 and R-02 state the two-digit rule for globals and the unpadded rule for module IDs, `MS-NN` registered as a module namespace with its milestone table, `M-` added to the forbidden legacy prefixes, and two checks added: E-19 for a prose block that a module copies from a global document or from its sibling file, and E-20 for a code span that names a missing path. No identifier was renumbered. |
