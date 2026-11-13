# Module 6 — Distribution

> **Purpose:** the distribution module of the reader.
> **Read when:** planning, analysing or closing this module.
> **Canonical for:** its scope, decisions and next step.
> **Do not duplicate:** requirements (`REQUIREMENTS.md`), implementation (`TECHNICAL.md`) and history (`CHANGELOG.md`).

**Status:** Pending
**Last update:** 2026-11-13

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

- The deliverable is a static file; there is no server, no installer and no environment configuration.
- The directory picker from `file://` is settled by D-15: the folder input is used there.
- Nothing is implemented yet.

## 9. Next step

Wait for the owner to select the module, then analyse it.
