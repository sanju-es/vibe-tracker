#!/usr/bin/env node

/**
 * Distribution audit for the single-file artifact.
 *
 * It reads `dist/index.html` and `package.json` only. No dependency, no network
 * and no write: the script either reports the artifact or fails the build.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ALLOWED_HOSTS = new Set(["cdn.jsdelivr.net"]);
const EXTERNAL_TAG_NAMES = ["script", "link", "img", "iframe", "source"];
const REQUIRED_CSP = {
  "default-src": ["'none'"],
  "script-src": ["'unsafe-inline'", "https://cdn.jsdelivr.net"],
  "style-src": ["'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:"],
  "font-src": ["'self'", "https://cdn.jsdelivr.net"],
  "connect-src": ["https://cdn.jsdelivr.net"],
  "object-src": ["'none'"],
  "base-uri": ["'none'"],
  "form-action": ["'none'"],
};
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const PINNED = /@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\/|$)/;
const SRI = /^sha(256|384|512)-[A-Za-z0-9+/]+=*$/;

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map(
    (match) => match[0],
  );
}

function attr(tag, name) {
  const match = new RegExp(
    `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  ).exec(tag);
  return match ? (match[1] ?? match[2] ?? match[3] ?? "") : null;
}

function isAllowedUrl(raw) {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && ALLOWED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function isPinned(url) {
  try {
    return PINNED.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

function hasSri(value) {
  return typeof value === "string" && value.split(/\s+/).some((token) => SRI.test(token));
}

function parseCsp(content) {
  const directives = new Map();
  for (const part of content.split(";")) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    const name = tokens.shift();
    if (name) directives.set(name.toLowerCase(), tokens);
  }
  return directives;
}

function auditCsp(html, fail) {
  const metas = tags(html, "meta").filter(
    (tag) => (attr(tag, "http-equiv") ?? "").toLowerCase() === "content-security-policy",
  );
  if (metas.length !== 1) {
    fail("csp", `expected one CSP meta tag, found ${metas.length}`);
    return;
  }

  const content = attr(metas[0], "content");
  if (!content) {
    fail("csp", "CSP meta has no content");
    return;
  }

  const directives = parseCsp(content);
  for (const [name, expected] of Object.entries(REQUIRED_CSP)) {
    const actual = directives.get(name);
    if (!actual) {
      fail("csp", `${name} is missing`);
      continue;
    }
    if (actual.join(" ") !== expected.join(" ")) {
      fail("csp", `${name} is "${actual.join(" ")}"; expected "${expected.join(" ")}"`);
    }
  }

  for (const [name, tokens] of directives) {
    for (const token of tokens) {
      if (token === "*" || token === "'unsafe-eval'" || token.startsWith("http:")) {
        fail("csp", `${name} contains a forbidden token "${token}"`);
      }
      if (token.startsWith("https://") && !isAllowedUrl(token)) {
        fail("csp", `${name} names a host outside the allowlist: ${token}`);
      }
    }
  }
}

function auditExternalAssets(markup, html, fail) {
  const assets = [];
  for (const name of EXTERNAL_TAG_NAMES) {
    for (const tag of tags(markup, name)) {
      const raw = attr(tag, "src") ?? attr(tag, "href");
      if (!raw) continue;

      if (
        name === "link" &&
        (attr(tag, "rel") ?? "").toLowerCase().includes("stylesheet")
      ) {
        fail(
          "inline-runtime",
          "an external stylesheet is not allowed in the single-file artifact",
        );
      }

      if (raw.startsWith("#") || raw.startsWith("data:") || raw.startsWith("blob:")) {
        continue;
      }
      if (!raw.startsWith("https://")) {
        fail("local-asset", `<${name}> references a local or unsupported asset: ${raw}`);
        continue;
      }

      const integrity = attr(tag, "integrity");
      const crossorigin = attr(tag, "crossorigin");
      const pinned = isPinned(raw);
      assets.push({ url: raw, integrity: hasSri(integrity), pinned });

      if (!isAllowedUrl(raw)) {
        fail("external-assets", `<${name}> uses a host outside the allowlist: ${raw}`);
      }
      if (!pinned) {
        fail("external-assets", `<${name}> URL is not version-pinned: ${raw}`);
      }
      if (!hasSri(integrity)) {
        fail("external-assets", `<${name}> URL has no SRI hash: ${raw}`);
      }
      if (!crossorigin) {
        fail("external-assets", `<${name}> cross-origin asset lacks crossorigin: ${raw}`);
      }
    }
  }

  const fontPattern = /https:\/\/cdn\.jsdelivr\.net\/npm\/@fontsource\/[^\s"'`)]+/g;
  for (const match of html.matchAll(fontPattern)) {
    const url = match[0];
    const nearby = html.slice(match.index, match.index + 260);
    const integrity = nearby.includes("integrity:");
    const pinned = isPinned(url);
    assets.push({ url, integrity, pinned });

    if (!pinned) {
      fail("external-assets", `font URL is not version-pinned: ${url}`);
    }
    if (!integrity) {
      fail("external-assets", `font URL has no SRI hash: ${url}`);
    }
  }

  const fetchPattern = /\bfetch\s*\(\s*([`'"])(https?:\/\/[^`'"]+)\1/g;
  for (const match of html.matchAll(fetchPattern)) {
    const url = match[2];
    if (!isAllowedUrl(url)) {
      fail("external-assets", `fetch() uses a host outside the allowlist: ${url}`);
    }
  }

  return assets;
}

/**
 * Audit a project root.
 *
 * @param {string} [root]
 * @returns {{
 *   file: string,
 *   bytes: number,
 *   version: string,
 *   externalAssets: Array<{ url: string, integrity: boolean, pinned: boolean }>,
 *   inlineScripts: number,
 *   inlineStyles: number,
 *   findings: Array<{ rule: string, detail: string }>,
 * }}
 */
export function auditArtifact(root = process.cwd()) {
  const findings = [];
  const fail = (rule, detail) => findings.push({ rule, detail });
  const artifact = path.join(root, "dist", "index.html");
  const distDir = path.join(root, "dist");
  const report = {
    file: path.relative(root, artifact).replaceAll(path.sep, "/"),
    bytes: 0,
    version: "unknown",
    externalAssets: [],
    inlineScripts: 0,
    inlineStyles: 0,
    findings,
  };

  let expectedVersion = "";
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    expectedVersion = String(pkg.version ?? "");
    report.version = expectedVersion || "unknown";
  } catch {
    fail("identity", "package.json is missing or unreadable");
  }
  if (!SEMVER.test(expectedVersion)) {
    fail(
      "identity",
      `package.json version is not semver: ${expectedVersion || "missing"}`,
    );
  }

  if (!fs.existsSync(distDir)) {
    fail("single-file", "dist/ does not exist; run npm run build first");
    return report;
  }

  const entries = fs.readdirSync(distDir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  if (files.length !== 1 || files[0] !== "index.html" || directories.length > 0) {
    fail(
      "single-file",
      `dist/ must contain only index.html; found ${[...files, ...directories.map((name) => `${name}/`)].join(", ") || "nothing"}`,
    );
  }
  if (!fs.existsSync(artifact)) {
    fail("single-file", "dist/index.html is missing; run npm run build first");
    return report;
  }

  const html = fs.readFileSync(artifact, "utf8");
  report.bytes = fs.statSync(artifact).size;
  if (!/^<!doctype html>/i.test(html.trimStart())) {
    fail("single-file", "the artifact does not start with <!doctype html>");
  }

  const scripts = tags(html, "script");
  const styles = tags(html, "style");
  report.inlineScripts = scripts.filter((tag) => !attr(tag, "src")).length;
  report.inlineStyles = styles.length;
  if (report.inlineScripts === 0) {
    fail("inline-runtime", "no inline application script was found");
  }
  if (report.inlineStyles === 0) {
    fail("inline-runtime", "no inline stylesheet was found");
  }

  auditCsp(html, fail);
  // Ignore tags that live inside the inlined application script: Svelte
  // templates contain strings such as `<img src="${...}">` and are not markup
  // of the artifact.
  const markup = html.replace(
    /<script\b([^>]*)>[\s\S]*?<\/script>/gi,
    "<script$1></script>",
  );
  report.externalAssets = auditExternalAssets(markup, html, fail);

  const versionMetas = tags(html, "meta").filter(
    (tag) => (attr(tag, "name") ?? "").toLowerCase() === "project-tracking-version",
  );
  if (versionMetas.length !== 1) {
    fail(
      "identity",
      `expected one project-tracking-version meta tag, found ${versionMetas.length}`,
    );
  } else {
    const version = (attr(versionMetas[0], "content") ?? "").trim();
    if (version !== expectedVersion) {
      fail(
        "identity",
        `artifact version "${version}" does not match package.json "${expectedVersion}"`,
      );
    }
  }

  return report;
}

function main() {
  const report = auditArtifact(process.cwd());
  const ok = report.findings.length === 0;
  const size = (report.bytes / 1024).toFixed(1);
  if (ok) {
    console.log(
      `Distribution audit passed: ${report.file} (${size} KiB, version ${report.version}, ${report.externalAssets.length} external asset(s)).`,
    );
    return;
  }

  console.error(`Distribution audit failed: ${report.file}`);
  for (const finding of report.findings) {
    console.error(`  - [${finding.rule}] ${finding.detail}`);
  }
  process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
