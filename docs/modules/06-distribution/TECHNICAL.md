# Module 6 — TECHNICAL

> **Purpose:** design, surface, data, implementation, tests and limits of the distribution module.
> **Read when:** changing the module or reviewing its technical constraints.
> **Canonical for:** components, data, tests and limits of this module.
> **Do not duplicate:** requirements (`REQUIREMENTS.md`) and shared architecture (`docs/ARCHITECTURE.md`).

**Status:** `Pending` (2026-11-13)
**Last update:** 2026-11-13

---

## 1. Design and principles

_not recorded._

## 2. Surface

No endpoints: the project has no own API. The surface is the build command and the generated artifact; its components and stores are not recorded.

## 3. Data

_not recorded._

## 4. Implementation

_not recorded._

## 6. Tests and evidence

_not recorded._

## 7. Limits and known limitations

- The artifact must stay a single file with a closed network boundary; external assets are limited to the allowlisted CDNs, with pinned version, SRI and fallback (D-22), which rules out unknown or experimental providers.
