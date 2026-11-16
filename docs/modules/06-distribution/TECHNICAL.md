# Module 6 — TECHNICAL

> **Purpose:** design, surface, data, implementation, tests and limits of the distribution module.
> **Read when:** changing the module or reviewing its technical constraints.
> **Canonical for:** components, data, tests and limits of this module.
> **Do not duplicate:** requirements (`REQUIREMENTS.md`) and shared architecture (`docs/ARCHITECTURE.md`).

**Status:** `Tested` (2026-11-16)
**Last update:** 2026-11-16

---

## 1. Design and principles

- **A gate, not a screen.** The module adds no view and no component. It verifies
  the artifact modules 1 to 5 already produce and records how it is shared.
- **The artifact is the source of truth.** The audit reads `dist/index.html`; it
  does not duplicate the application model or re-render a document.
- **Fail closed.** Any distribution regression fails `npm run build`; there is no
  advisory mode for the closure gate.
- **Stable identity.** The file stays `index.html`; the version lives in a meta
  tag read from `package.json`, so support can identify an artifact without
  renaming the file.
- **Manual evidence for what static analysis cannot see.** Offline startup,
  keyboard paths, contrast and the dictionary review are recorded by hand; no new
  browser-automation dependency is introduced.

## 2. Surface

No endpoints: the project has no own API. The module adds or touches:

| Surface | Responsibility |
|---|---|
| dist-audit.mjs (under `scripts/`) | Dependency-free artifact audit and CLI entry point |
| dist-audit.test.ts (under `tests/`) | Fixtures proving each audit rule fails when it should |
| `vite.config.ts` | Build plugin that injects the version meta tag from `package.json` |
| `package.json` | `dist:check` script and the build chain |
| `README.md` | Project welcome and documentation entry point; no development instructions |
| `docs/ARCHITECTURE.md` | Build command and artifact identity |
| `PROJECT_STATE.md` | Quality command and module state |

The audit does not add components, stores or runtime code to the application.

## 3. Data

The audit reads:

- `dist/` directory entries and the contents of `dist/index.html`;
- `package.json` for the expected version;
- the CSP meta and the external references in the artifact.

It reports:

```ts
type DistReport = {
  file: string;
  bytes: number;
  version: string;
  externalAssets: Array<{ url: string; integrity: boolean; pinned: boolean }>;
  inlineScripts: number;
  inlineStyles: number;
  findings: Array<{ rule: string; detail: string }>;
};
```

`findings` is empty on success. The CLI prints a one-line summary and the
findings; the process exits `1` when any rule fails.

## 4. Implementation

**Version metadata.** `vite.config.ts` gains an `injectArtifactMetadata` build
plugin. It reads the version from `package.json` and injects:

```html
<meta name="project-tracking-version" content="0.1.0" />
```

The plugin injects exactly one tag, after `<head>` and before the application
script. No build date, commit hash or random value is added, so the artifact stays
reproducible for the same inputs.

**Audit script.** The new dist-audit.mjs under `scripts/` uses only `node:fs`, `node:path` and
`node:url`. It exports the pure checks for tests and exposes a `main()` for the
CLI. The checks are:

1. **Single file.** `dist/` exists and contains exactly one file, `index.html`; the
   file is non-empty and starts with `<!doctype html>`.
2. **Inline runtime.** At least one module script without `src` and one inline
   `<style>` exist. No external stylesheet or local script/link/image remains.
3. **Identity.** Exactly one `project-tracking-version` meta exists and its value
   equals `package.json.version` (a semver, pre-release suffix allowed).
4. **CSP.** Exactly one CSP meta exists. It keeps `default-src 'none'`,
   `object-src 'none'`, `base-uri 'none'` and `form-action 'none'`; `script-src`
   allows `'unsafe-inline'` and only the allowlisted host; `style-src` allows only
   `'unsafe-inline'`; `font-src` and `connect-src` name only the allowlisted host.
   No `*`, `http:`, `'unsafe-eval'` or extra host is accepted.
5. **External assets.** Every `<script src>` or `<link href>` is `https://` from
   the allowlist, contains a pinned version (`@x.y.z`), and carries a
   `sha256-`/`sha384-`/`sha512-` integrity value. The same rule applies to the
   Inter font URLs embedded in the module script.
6. **No local assets.** Any `src`/`href` that is not `https:`, `data:`, `blob:` or
   an in-page anchor fails.

The allowlist is the D-22 set; the current artifact uses only
`https://cdn.jsdelivr.net`. Adding a host requires the same task to update the CSP
and the audit constant.

**Build chain.** `package.json` gains:

```json
"dist:check": "node scripts/dist-audit.mjs",
"build": "npm run check && vite build && npm run dist:check"
```

`dist:check` is also useful on its own for an existing artifact.

**Tests.** The new dist-audit.test.ts under `tests/` writes small fixture directories under the
OS temporary directory and asserts pass/fail for: extra file, missing file,
missing CSP, widened CSP, disallowed host, unpinned URL, missing SRI, local asset
reference, version mismatch and a valid artifact with zero external assets. The
real build is covered by `npm run build` and the offline check.

**Documentation.** `README.md` is a welcome with a screenshot and links to the
project documentation; it carries no development, distribution, linter or version
control instructions. The distribution details live in `docs/ARCHITECTURE.md` §9
and in this technical document; `PROJECT_STATE.md` §2 records the commands and the
identity rule.

**Accessibility and dictionary.** No UI change is planned. The full pass may fix
a finding in the modules that own the surface; such a fix is part of this module
and is recorded in its tests and changelog. The existing type-checked dictionary
is the source of truth; the review looks for strings outside it, not for a new
translation layer.

## 5. Interaction and behaviour

**Build.** A normal build runs the type check, Vite and the audit. A failure names
the rule and the offending path, for example:

```text
Distribution audit failed: dist/app.js is not allowed; expected only index.html.
```

**Audit alone.** `npm run dist:check` reads the current artifact. When `dist/` is
missing it says to run `npm run build`; it never creates or repairs the artifact.

**Distribution.** The user copies `dist/index.html`, opens it in Chrome or Edge
and chooses the project folder. The artifact is the reader, not a bundle of the
documents; each person reads their own copy. No server or install step is needed.

**Offline.** With the network disabled, the optional Lucide and Inter requests
fail and the glyph/system-font fallbacks take over. The reader stays usable; this
is checked manually and recorded in §6.

**Accessibility.** The pass walks the banner, sidebar, document, tables, search,
backlog, requirements and dashboard views, and the modals: tab order, focus
visibility, skip link, `Esc`, focus return and row activation. Contrast is checked
against WCAG 2.1 AA on the light tokens; 200 % zoom must keep the layout
operable.

**Dictionary.** Each view and dialog is compared with `src/lib/i18n`; document
content remains source text. Missing keys, hardcoded interface text and invented
messages are fixed before closure.

**Release policy.** No tag is created in this module. When the owner commits a
closed module and the quality gate is green, a tag `v<package version>` may be
created; `RELEASES.md` is not created until that first tag.

## 6. Tests and evidence

- **Unit tests:** the new dist-audit.test.ts under `tests/` covers the valid
  artifact, zero external assets, extra file, missing artifact, missing and
  widened CSP, disallowed host, unpinned URL, missing SRI, missing crossorigin,
  local asset, data/blob references, version mismatch and a font without SRI.
  `npm run test` on 2026-11-16: 155 tests across 16 suites, all green.
- **Build evidence:** `npm run build` on 2026-11-16 ended with
  `Distribution audit passed: dist/index.html (218.9 KiB, version 0.1.0, 3 external
  asset(s))`; Vite reported 224.10 kB and the file contains one version meta and
  one CSP meta.
- **Static checks:** `npm run check` 0 errors/0 warnings; `npm run lint` clean;
  `npm run docs:check` 45 files and 97 links, 0 findings.
- **Offline startup:** headless Edge with `cdn.jsdelivr.net` mapped to
  `127.0.0.1` rendered the empty state and the `▸` glyph fallback, so the app
  starts without the CDN. The owner's closure on 2026-11-16 accepts the remaining
  manual Edge check for folder reading, tables, search and modals.
- **Accessibility evidence:** the light tokens were measured against WCAG 2.1 AA:
  body text 17.75:1, muted text on the darkest surface 4.71:1, the lowest status
  text on its chip 4.90:1, the lowest status text on a surface 4.53:1, the control
  border 3.64:1 and white on the accent 5.17:1. The status tokens were darkened
  where the chip or surface pair fell below 4.5:1. The keyboard review covers the
  skip link, modal focus trap/Escape/focus return, row activation, progressbar
  roles and the search result live region; the owner's closure accepts the full
  Edge keyboard and 200 % zoom check.
- **Dictionary evidence:** the review found one hardcoded interface string
  (`broken link`) and moved it to `document.brokenLink`; `nav.toggleModule` and
  `search.results` were added for unique labels and the result announcement. The
  type-checked dictionary has no missing key, and no other hardcoded interface
  text was found in the Svelte sources.

The owner closed the module on 2026-11-16; the acceptance table is verified.

## 7. Limits and known limitations

- The audit is static: it proves the artifact's references and policy, not that a
  browser never attempts another request. Offline behaviour stays a manual check.
- The single-file build needs `'unsafe-inline'` for its inlined script and style;
  the CSP trade-off is the one accepted in D-14.
- The version meta is identification, not a signature: it does not prove the file
  was not modified. SRI protects the external assets, not the HTML.
- Accessibility and dictionary evidence is manual; no browser-automation or
  screen-reader dependency is added.
- No tag, release notes or `RELEASES.md` are created now; only the policy is
  recorded.
- The artifact reads a project folder; sharing the HTML does not embed or share
  the project's documentation.
- Native packaging, an installer and auto-update remain out of scope.
