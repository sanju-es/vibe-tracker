---
name: Frontend
description: Frontend conventions for Project Tracking (Svelte 5 + TypeScript + Vite + Tailwind CSS 4, single-file build). Use when a task changes views, components, state, styling, accessibility, i18n or frontend tests.
---

# Frontend

## Read first

- `docs/ARCHITECTURE.md` §3 (code organization) and §7 (conventions).
- The active module's `REQUIREMENTS.md` and `TECHNICAL.md`.
- `docs/DECISIONS.md` when the task touches a recorded decision.

## Stack

- Framework: Svelte 5 + TypeScript, built with Vite and `vite-plugin-singlefile`
- UI: Tailwind CSS 4 + own components
- State: Svelte 5 runes and stores in `src/stores`
- Data: Markdown files read from the folder selected with the directory picker or
  the folder input (`src/lib/fs`)

## Rules

1. **Views compose, components render.** A view owns page state and composition;
   a reusable component receives props and emits events. No filesystem access
   from a presentational component.
2. **One filesystem gateway.** Every folder or file access goes through
   `src/lib/fs`. No component imports the File System Access API or reads files
   by itself.
3. **One state home.** Shared state lives in `src/stores`; local state stays
   local. Do not duplicate the parsed documents in two stores.
4. **Every surface that reads the folder has four states:** loading, empty,
   success and error. Errors show a translated message and a retry path when
   possible.
5. **Accessibility is part of done:** labels, keyboard navigation, visible focus,
   native semantics before `aria-*`, contrast target WCAG 2.1 AA (4.5:1 for text).
6. **i18n:** no hard-coded user-facing text. Every string comes from the single
   English message dictionary (D-16); adding a language is a new decision.
7. **Styling:** use the shared tokens and Tailwind utilities; no one-off colours
   or magic spacing. The interface is light only (D-18).
8. **External assets are the exception.** The app ships two allowlisted assets —
   the Lucide bundle and two Inter files, both from jsDelivr with SRI (D-23). A new
   one may use only jsDelivr, cdnjs, unpkg or Google Fonts, with a pinned version,
   an SRI hash and a fallback; never make it essential (D-22).
9. **Svelte discipline:** no `{@html}` with document content or with any string
   that a component did not produce (D-12, CR-03); use runes (`$state`,
   `$derived`) instead of legacy reactive-store patterns.

## Forbidden

- `{@html}` with document content or with a string a component did not produce.
- Disabling type checking or lint rules to make a build pass.
- A new dependency for something the platform or the current stack already
  provides, without the owner's approval.
- Copying a component instead of reusing or extending it.

## Build and tests

```bash
npm run lint
npm run test
npm run build
```

- Type checking and the production build must be green.
- New interactive behaviour gets a unit test where the logic is testable, or an
  explicit manual check recorded in the module `CHANGELOG.md`.

## Project rules

- No new dependency without the owner's approval.
- No request of the app itself; external assets only from the allowlisted CDNs,
  pinned and with SRI (D-22).
- Markdown parsing never mixes presentation: it returns typed data and the UI
  only renders it.

## Checklist

- [ ] Reused existing components and tokens.
- [ ] Loading, empty, success and error states.
- [ ] Keyboard and screen-reader path verified.
- [ ] Interface strings come from the message dictionary.
- [ ] Light-only palette respected; no theme control reintroduced.
- [ ] Any external asset is allowlisted, pinned and carries SRI (D-22).
- [ ] Lint, tests and build green.
