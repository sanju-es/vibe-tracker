# Module 6 — Distribution

> **Purpose:** the distribution module of the reader.
> **Read when:** planning, analysing or closing this module.
> **Canonical for:** its scope, decisions and next step.
> **Do not duplicate:** requirements (`REQUIREMENTS.md`), implementation (`TECHNICAL.md`) and history (`CHANGELOG.md`).

**Status:** `Tested` (2026-11-16)
**Last update:** 2026-11-16

---

## 1. Purpose

Turn the application into the shareable artifact the project promises: one `index.html` that opens offline, keeps the network boundary to the allowlisted CDNs (D-22), is accessible, with every interface string coming from the message dictionary.

## 2. Scope

### In scope

- Verify that the production build emits one self-contained `index.html` with every script and style inlined.
- Define the content security policy used by the artifact and confirm that the app works without any network access.
- Verify that every external asset, if any, comes from the allowlisted CDNs, with a pinned version, an SRI hash and a fallback (D-22).
- Complete the accessibility pass to the target recorded in [`docs/DECISIONS.md`](../../DECISIONS.md) §2, including keyboard paths and contrast on the light theme.
- Review the English message dictionary for missing or invented strings.
- Define how the artifact is named, versioned and shared with a project.

### Out of scope

- Application features owned by modules 1 to 5.
- Packaging as a native desktop executable.
- Auto-update mechanisms.

## 6. Documentation map

- [REQUIREMENTS.md](REQUIREMENTS.md): functional requirements, rules and acceptance.
- [TECHNICAL.md](TECHNICAL.md): design, surface, data, implementation, tests and limits.
- [CHANGELOG.md](CHANGELOG.md): dated history.
- [BACKLOG.md](BACKLOG.md): corrections and future work (only when reopening).

## 7. Decisions

| Decision | Gloss |
|---|---|
| D-01 | Vite, Svelte 5 and TypeScript compiled into one self-contained `index.html`. |
| D-15 | The folder input covers `file://`; both adapters sit behind one interface. |
| D-22 | Closed CDN allowlist with pinned versions, SRI and fallback. |
| D-23 | Lucide icons and Inter with local fallbacks. |
| D-35 | Blocking `dist:check`; `index.html` plus a version meta tag; no release tag; manual accessibility and dictionary evidence. |

## 9. Next step

Closed as `Tested` on 2026-11-16 by the owner's decision; every acceptance row is
verified and no open items remain.

## 10. Module-specific notes

### Open points

- The deliverable is a static file: no server, no installer and no environment configuration.
- Artifact identity: `index.html` plus a `project-tracking-version` meta tag read
  from `package.json`; the name does not change (D-35).
- Verification: a dependency-free `npm run dist:check` wired after the build,
  with manual offline evidence (D-35).
- Release: no tag and no `RELEASES.md`; only the future `v<version>` policy is
  recorded. `E-02` stays disabled until tags exist.
- The owner closed the module on 2026-11-16; the acceptance table is verified.
