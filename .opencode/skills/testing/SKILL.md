---
name: Testing
description: Test strategy for Project Tracking (Vitest over the domain layer). Use when a task adds or changes behaviour, fixes a bug, or needs the definition of done verified.
---

# Testing

## Read first

- The active module's `REQUIREMENTS.md` (what must be true) and `TECHNICAL.md`
  (how it is built).
- `docs/WORKFLOW.md` §8 (definition of done).

## Strategy

- **Unit tests with Vitest** cover the domain layer: `src/lib/model`,
  `src/lib/markdown` and the pure helpers used by `src/lib/fs` and
  `src/lib/i18n`. They run without a browser, a DOM or network access.
- **Fixtures are the real project documents** read from the repository, so the
  extractors are tested against the structure the app actually reads.
- **Component and end-to-end tests are not part of the agreed scope.** The
  browser-only behaviour (folder picker, permissions) is verified
  manually and recorded in the module `CHANGELOG.md`. Adding a component or E2E
  framework requires the owner's approval.

Rules:

- Tests describe behaviour, not implementation details.
- One assertion family per test; a failing test names the broken rule.
- Unit tests are fast and deterministic: no network, no real clock, no random
  data without a seed.
- A bug fix adds a regression test that fails before the fix.
- A rule documented in `REQUIREMENTS.md` must have a test or a recorded manual
  verification.

## Commands

```bash
npm run test
npm run test:watch
```

- Report the literal result; never assume green.
- If a test is skipped, state why and link the backlog item.

## Coverage

Coverage is a signal, not a target. Do not add assertion-free tests to raise it.

## Test data

- Fixtures are read from the repository itself; no copy is kept under `tests/`.
- No personal data, credentials or documents from other projects.

## Checklist

- [ ] New rule covered by a test or a recorded manual check.
- [ ] Bug fix has a regression test.
- [ ] Tests pass locally and are deterministic.
- [ ] Parser changes tested against a real document, not only inline strings.
- [ ] Manual checks recorded in the module `CHANGELOG.md` when automation is not
      possible.

## Project rules

- No new dependency without the owner's approval.
- No request of the app itself; external assets only from the allowlisted CDNs,
  pinned and with SRI (D-22).
- Markdown parsing never mixes presentation: it returns typed data and the UI
  only renders it.
