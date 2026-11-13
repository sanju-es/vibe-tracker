# WORKFLOW.md — Project Tracking (way of working)

> **Purpose:** module cycle, states, change management and documentation maintenance.
> **Read when:** starting a session, planning a module, or closing one.
> **Canonical for:** the module lifecycle, the definition of done and the documentation rules.
> **Do not duplicate:** the form of the documents (`docs/DOC-STANDARD.md`) and the process routing (`AGENTS.md`).

**Last update:** 2026-11-13

---

## 1. Incremental development

- Work on **one main module at a time** (a screen, a component group, a set of
  parsing rules, a functional area).
- The assistant **does not choose modules**: after closing one, it waits for the
  owner's selection.
- The inventory and states live in [`PROJECT_STATE.md` §6](../PROJECT_STATE.md).
  The recommended order is recorded, but the owner decides.

## 2. Per-module cycle

1. **Analysis.** Goal, screens/components, user actions, data, operations,
   business rules, validations, dependencies and edge cases.
   If information is missing, **ask; do not invent requirements or behaviour.**
   When the analysis is approved, the module moves to `Implementation proposal`.
2. **Implementation proposal.** What is built, how it works, views and components
   affected, parsing and model changes, reusable components, tests planned and
   risks. **Wait for approval.** The module stays in `Implementation proposal`;
   **no implementation code is written in this phase.**
3. **Implementation.** UI connected to the real data source (the selected project
   folder) + validations + loading/success/error states. Respect conventions,
   reuse, do not duplicate and do not touch other modules. If a previous module
   must change, explain the impact first. **No change to shared code without an
   approved proposal.** Approval moves the module to `In development`.
4. **Closure.** The module ends when it meets the criteria: working UI,
   functional behaviour, integration, validations, errors, tests and updated
   documentation. Deliver a summary: features, files, tests and problems. Wait
   for the owner's decision.

## 3. Module states and lifecycle

Valid states:

`Pending` · `In analysis` · `Implementation proposal` · `In development` ·
`Implemented` · `Tested` · `Blocked`

Module 0 additionally uses `Active (permanent)`, explained in the exception below.

- Usual sequence: `In analysis` → `Implementation proposal` → `In development` →
  `Implemented` → `Tested`. `Blocked` can be applied from any state. `Pending` is
  the initial state of roadmap modules.
- **Module 0 exception (Core).** Module 0 is a permanent cross-cutting
  container. It is always `Active`, never closes as `Tested` and does not
  consume the active module slot. Its work items (`CORE-NN`) follow the normal
  cycle and are verified one by one.
- The state **reflects the reality of the moment**; no `In development` is left
  as a placeholder.
- **Reopening:** state → `In development`, cause recorded in the module's
  `CHANGELOG.md` (correction vs. feature). On closure → `Tested` after tests.
- A bug fix corrects documented behaviour; it does not introduce a requirement.
- A new feature adds an entry to `REQUIREMENTS.md` and follows §4.

## 4. Change management

- When an idea or change appears: analyse the impact (affected modules,
  technical and functional implications, incompatibilities), propose a solution
  and **wait for approval**.
- If it belongs to another module, add it to that module's pending list.
- A small change **does not authorise** unrelated refactorings.
- All information is updated **in the same task** in which it changes.

## 5. Version control and commits

The project uses Git with a trunk-based workflow:

- Work lands on `main`; short task branches are allowed while a task is open.
- One commit per closed task, in Conventional Commits format (`feat:`, `fix:`,
  `docs:`, `chore:`…).
- Stage only the files of the current task and review the diff before committing.
- Only approved work is committed. The assistant never commits, tags or pushes
  without an explicit instruction from the owner.
- The first commit of the repository is the owner's decision.

## 6. Documentation honesty

- Do not mark as implemented what is only planned.
- Do not turn proposals into confirmed requirements or approved decisions.
  Decisions go to `DECISIONS.md`, separating approved, adopted by default and
  pending.
- Do not delete recorded information: a decision change is a new entry with a
  date.
- The assistant proposes improvements, warns about risks and explains decisions.
  **The owner has the final word** on functional and architectural matters.

## 7. Documentation maintenance

**When starting a session**

- Read `PROJECT_STATE.md`, identify the active module and load **only** its
  documentation (`docs/modules/<module>/`). Load the rest of `docs/` only when
  the task requires it.
- Do not load the full documentation of other modules.
- Do not load `BACKLOG.md` unless the module is being reopened or planned.
  Exception: the Core backlog may be read for shared/core work when the project
  keeps a Core container.

**When working on a module**

- Update `MODULE.md` when scope or state changes.
- Update `REQUIREMENTS.md` when requirements change.
- Update `TECHNICAL.md` when implementation or the data model changes.
- Update `CHANGELOG.md` for relevant changes.
- Update `PROJECT_STATE.md` when the global state changes.
- When reopening a closed module, read its `BACKLOG.md`, triage the items and
  reflect the accepted ones in `REQUIREMENTS.md` or the proposal. Discarded
  items are not deleted.

**When modifying the architecture**

- Update `ARCHITECTURE.md`, record important decisions in `DECISIONS.md` and
  update affected references.

**When closing a module**

- Check that the documentation matches the code.
- Fix the state and record pending changes or known limitations.
- Leave its `BACKLOG.md` (header and entries).
- Update the global index (`PROJECT_STATE.md`).
- Run `node scripts/docs-audit.mjs`; any `must` finding fails the command
  (`--advisory` only reports).

**Module document set**

- `MODULE.md`: status, purpose and scope, out of scope, decisions and next step.
- `REQUIREMENTS.md`: functional requirements, business rules, flows,
  validations, edge cases and dependencies. No implementation detail.
- `TECHNICAL.md`: design, surface, data, implementation, tests and limits.
- `CHANGELOG.md`: dated history only. No state, pending work or duplicated
  implementation logs.
- `BACKLOG.md`: corrections and future work only, in the registered table shape.
  Never read during onboarding (except for the Core container).

**Module 0 exception:** module 0 uses `MODULE.md`, `TECHNICAL.md`, `BACKLOG.md`
and `CHANGELOG.md`, but not `REQUIREMENTS.md`. Its cross-cutting invariants live
in `MODULE.md` as `CR-NN` and link to the architecture and the decisions. Module
0 is link-first: it must not duplicate architecture or decision content.

**Golden rule:** `PROJECT_STATE.md` never concentrates detail. It is an index
and global state; the detail lives in `docs/ARCHITECTURE.md`,
`docs/DECISIONS.md` and `docs/modules/`.

## 8. Definition of done and quality gates

### Definition of done

A module is `Implemented` only when:

- the agreed scope is built and connected to the real data source (the selected
  project folder);
- validations and loading/success/error states exist;
- the build and the test commands are green;
- the module documentation is updated;
- no unresolved placeholder or undocumented deviation remains.

A module is `Tested` only when the owner (or an automated E2E suite) has verified
the behaviour against the documented requirements. Tests never replace the
owner's acceptance.

### Quality gates

Routing lives in `AGENTS.md`. A gate is **read-only** by default: it reports
findings with `file:line` evidence. Blocking findings (security, data loss,
contract mismatch) stop the task and go to the owner; advisory findings are
reported and left to the owner.
