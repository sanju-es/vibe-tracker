# Module 6 — REQUIREMENTS

> **Purpose:** functional requirements, rules and acceptance of the distribution module.
> **Read when:** verifying behaviour, judging a change or reopening the module.
> **Canonical for:** `FR-NN`, `BR-NN` and `VAL-NN` of this module.
> **Do not duplicate:** scope (`MODULE.md` §2) and implementation (`TECHNICAL.md`).

**Status:** `Tested` (2026-11-16)
**Last update:** 2026-11-16

---

## 1. Goal

Deliver the shareable artifact: one accessible `index.html` that opens offline,
respects the network boundary and uses the message dictionary.

## 2. Functional requirements

### FR-1 — Artifact identity

The production build emits one artifact at `dist/index.html`. The file name stays
`index.html`; the build injects a `project-tracking-version` meta tag with the
version read from `package.json`. The version identifies the artifact but does not
rename it or create a second file.

### FR-2 — Single-file build

The artifact contains no local script, stylesheet, font or image file. JavaScript
and CSS are inlined. External assets, when present, are optional and limited to
the allowlisted CDNs (D-22).

### FR-3 — Post-build audit

`npm run dist:check` runs a dependency-free Node audit over `dist/`. It exits
non-zero with a specific message when a rule fails. It verifies:

- exactly one artifact file, named `index.html`;
- inline application JavaScript and CSS;
- the version meta tag matches `package.json`;
- the content security policy is present and does not widen the approved hosts;
- every external script or link is allowlisted, version-pinned and carries SRI;
- every external font URL is version-pinned and carries SRI;
- no local asset reference remains in the artifact.

### FR-4 — Blocking build

`npm run build` runs `npm run check`, `vite build` and `npm run dist:check` in
that order. A failed audit fails the build; there is no advisory closure mode.

### FR-5 — Network boundary

The content security policy stays the one declared in `vite.config.ts`:
`default-src 'none'`, inline script and style, jsDelivr for the optional script
and fonts, and `connect-src` limited to the same host. No other external host is
introduced.

### FR-6 — Offline operation

With the network disabled, opening the built artifact still starts, reads a
selected folder and renders its documents. Icons fall back to glyphs and the
typeface to the system font; neither failure blocks reading.

### FR-7 — Accessibility pass

The complete pass targets WCAG 2.1 AA on the light theme: contrast, keyboard
access to every action, visible focus, the skip link, modal focus trap, `Esc` and
focus return, table and row activation, and 200 % zoom/reflow. Findings are fixed
or recorded with their reason before closure.

### FR-8 — Dictionary review

Every interface string comes from `src/lib/i18n`. The review checks for missing
keys, hardcoded interface text and invented messages; document titles, paths and
source data stay as written. The interface remains English only (D-16).

### FR-9 — Sharing and release policy

`README.md` is the project welcome and points to the distribution instructions;
the detailed build, copy, offline and version rules live in
[`docs/ARCHITECTURE.md`](../../ARCHITECTURE.md) §9 and this module's
[`TECHNICAL.md`](TECHNICAL.md). No release tag is created in this module; the
future tag format is `v<package version>` after a commit and a green quality gate.

## 3. Business rules

- **BR-1 — One artifact.** The deliverable is one `index.html`; there is no
  server, installer, service worker or environment configuration.
- **BR-2 — Closed allowlist.** External resources come only from jsDelivr, cdnjs,
  unpkg or Google Fonts; each is pinned, carries SRI and is non-essential (D-22).
- **BR-3 — The audit is blocking.** A distribution regression fails the build; it
  is never reported as an advisory finding.
- **BR-4 — No new dependency.** The audit uses Node built-ins; the accessibility
  and dictionary reviews use the browser and the existing test suite.
- **BR-5 — Stable file name.** Versioning is metadata, not a versioned filename.
  The build is reproducible; no build date or random value enters the artifact.
- **BR-6 — No tag yet.** This module records the release policy but creates no
  tag, no `RELEASES.md` and no release notes.
- **BR-7 — Read-only and local.** The artifact still reads Markdown read-only,
  sends no text or telemetry and stores nothing between sessions.
- **BR-8 — Accessibility target.** WCAG 2.1 AA contrast on the light theme is the
  target; automated tooling does not replace the recorded manual evidence.
- **BR-9 — Dictionary is the only interface source.** English is the only
  interface language; source content is never translated or invented.

## 4. Flows

1. **Build and audit.** Run `npm run build` → type check → Vite build → artifact
   audit → one `dist/index.html` with the version meta.
2. **Audit alone.** Run `npm run dist:check` → the existing artifact is audited;
   a missing or stale artifact fails with a clear message.
3. **Share.** Copy `dist/index.html` → open it in Chrome or Edge → choose the
   project folder → read the documentation offline.
4. **Verify offline.** Disable the network → open the artifact → choose a folder →
   confirm the reader works and the fallbacks are visible.
5. **Accessibility review.** Walk the keyboard paths, check contrast and zoom,
   fix findings, record the evidence in `TECHNICAL.md` §6.
6. **Dictionary review.** Inspect every view and dialog, confirm each string comes
   from the dictionary, fix gaps, run the tests and record the evidence.
7. **Future release.** Commit the closed work → green quality gate → tag
   `v<package version>`; no tag is created now.

## 5. Validations

- **VAL-1** — `dist/` contains an extra file: the audit fails and names it.
- **VAL-2** — `dist/index.html` is missing: the audit fails with the expected path.
- **VAL-3** — The CSP meta is missing or widens a directive: the audit fails.
- **VAL-4** — An external host is outside the allowlist: the audit fails.
- **VAL-5** — An external URL is not version-pinned: the audit fails.
- **VAL-6** — An external script or font lacks SRI: the audit fails.
- **VAL-7** — A local script, stylesheet or image reference remains: the audit fails.
- **VAL-8** — The version meta is missing or differs from `package.json`: the audit
  fails.
- **VAL-9** — Offline startup: the reader works, or the failure is recorded as a
  blocking finding.
- **VAL-10** — Accessibility: a critical keyboard or contrast failure is fixed or
  recorded as a blocking finding before closure.
- **VAL-11** — Dictionary: a missing key or hardcoded interface string is fixed
  before closure.

## 6. Edge cases

- `dist/` does not exist or contains an artifact from an earlier build: the audit
  fails and tells the user to run the build.
- The version is a pre-release such as `0.1.0-beta.1`: the meta tag keeps the
  exact `package.json` value.
- The built HTML is minified into one line: checks must not depend on line breaks.
- The project runs on Windows with CRLF files: the audit reads UTF-8 and uses
  platform-neutral paths.
- The CDN is unavailable: icons and fonts fall back; the audit still passes
  because the assets are optional.
- The file is opened from `file://` or served with `npm run preview`: both folder
  adapters keep working (D-15).
- A future allowlist host is approved: the CSP and the audit allowlist change in
  the same task; until then the audit fails.
- No external assets are present: the audit accepts zero external references.
- A duplicate CSP or version meta appears: the audit reports the duplicate as a
  finding.

## 8. Dependencies

- **Depends on:** modules 1 to 5 for the screens and the artifact to verify.
- **Shared code:** module 0 for the build configuration, the i18n dictionary and
  the design tokens.

## 9. Acceptance criteria

| FR | Criterion | Evidence | Status |
|---|---|---|---|
| FR-1 | The artifact is `dist/index.html` and carries the version meta from `package.json`. | `npm run build`, dist audit | verified (2026-11-16) |
| FR-2 | The artifact is the only file and its JavaScript and CSS are inline. | dist audit | verified (2026-11-16) |
| FR-3 | `npm run dist:check` fails for each documented invalid artifact. | dist-audit tests | verified (2026-11-16) |
| FR-4 | `npm run build` runs the audit and fails when it fails. | `npm run build` | verified (2026-11-16) |
| FR-5 | The CSP names only the allowlisted host and keeps the approved directives. | dist audit | verified (2026-11-16) |
| FR-6 | The artifact reads a folder and renders documents with the network disabled. | Owner closure, manual check | verified (2026-11-16) |
| FR-7 | The keyboard, focus, contrast and zoom pass has no unresolved critical finding. | Owner closure, manual checklist | verified (2026-11-16) |
| FR-8 | No interface string is missing from the dictionary or hardcoded outside it. | Manual review, `npm run test` | verified (2026-11-16) |
| FR-9 | The README is a welcome that points to the distribution docs; no tag is created. | `README.md`, architecture review | verified (2026-11-16) |
