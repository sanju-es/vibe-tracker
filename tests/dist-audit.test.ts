import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { auditArtifact } from "../scripts/dist-audit.mjs";

const CSP =
  "default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net; " +
  "style-src 'unsafe-inline'; img-src 'self' data: blob:; " +
  "font-src 'self' https://cdn.jsdelivr.net; connect-src https://cdn.jsdelivr.net; " +
  "object-src 'none'; base-uri 'none'; form-action 'none'";

const LUCIDE =
  '<script src="https://cdn.jsdelivr.net/npm/lucide@1.72.0/dist/umd/lucide.min.js" ' +
  'integrity="sha384-test" crossorigin="anonymous" defer></script>';

const FONT_SCRIPT =
  '<script type="module">const fonts=[{url:`https://cdn.jsdelivr.net/npm/' +
  "@fontsource/inter@5.3.0/files/inter-latin-400-normal.woff2`" +
  ",integrity:`sha384-test`}];</script>";

const roots: string[] = [];

function artifact(
  options: {
    csp?: string | null;
    version?: string;
    externalScript?: string;
    fontScript?: string;
    body?: string;
    extraFiles?: Array<[string, string]>;
  } = {},
) {
  const {
    csp = CSP,
    version = "0.1.0",
    externalScript = LUCIDE,
    fontScript = FONT_SCRIPT,
    body = '<script type="module">console.log("app")</script><style>body{color:#000}</style>',
    extraFiles = [],
  } = options;
  const root = mkdtempSync(join(tmpdir(), "pt-dist-audit-"));
  roots.push(root);
  mkdirSync(join(root, "dist"));
  writeFileSync(join(root, "package.json"), JSON.stringify({ version }));
  writeFileSync(
    join(root, "dist", "index.html"),
    [
      "<!doctype html>",
      '<html lang="en"><head><meta charset="utf-8" />',
      `<meta name="project-tracking-version" content="${version}" />`,
      csp === null
        ? ""
        : `<meta http-equiv="Content-Security-Policy" content="${csp}" />`,
      externalScript,
      fontScript,
      "</head><body>",
      body,
      "</body></html>",
    ].join(""),
  );
  for (const [name, content] of extraFiles) {
    writeFileSync(join(root, "dist", name), content);
  }
  return root;
}

function rules(root: string) {
  return auditArtifact(root).findings.map((finding: { rule: string }) => finding.rule);
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("distribution audit", () => {
  it("accepts a valid single-file artifact", () => {
    expect(auditArtifact(artifact()).findings).toEqual([]);
  });

  it("accepts an artifact with no external assets", () => {
    expect(rules(artifact({ externalScript: "", fontScript: "" }))).toEqual([]);
  });

  it("rejects an extra file in dist", () => {
    expect(rules(artifact({ extraFiles: [["app.js", "console.log(1)"]] }))).toContain(
      "single-file",
    );
  });

  it("rejects a missing artifact", () => {
    const root = artifact();
    rmSync(join(root, "dist", "index.html"));
    expect(rules(root)).toContain("single-file");
  });

  it("rejects a missing content security policy", () => {
    expect(rules(artifact({ csp: null }))).toContain("csp");
  });

  it("rejects a widened content security policy", () => {
    const widened = CSP.replace(
      "https://cdn.jsdelivr.net; style-src",
      "https://cdn.jsdelivr.net https://evil.example; style-src",
    );
    expect(rules(artifact({ csp: widened }))).toContain("csp");
  });

  it("rejects an external host outside the allowlist", () => {
    const external = LUCIDE.replace(
      "https://cdn.jsdelivr.net/npm/lucide@1.72.0",
      "https://evil.example/lucide@1.72.0",
    );
    expect(rules(artifact({ externalScript: external }))).toContain("external-assets");
  });

  it("rejects an unpinned external URL", () => {
    const external = LUCIDE.replace("lucide@1.72.0", "lucide");
    expect(rules(artifact({ externalScript: external }))).toContain("external-assets");
  });

  it("rejects an external asset without SRI", () => {
    const external = LUCIDE.replace(' integrity="sha384-test"', "");
    expect(rules(artifact({ externalScript: external }))).toContain("external-assets");
  });

  it("rejects an external asset without crossorigin", () => {
    const external = LUCIDE.replace(' crossorigin="anonymous"', "");
    expect(rules(artifact({ externalScript: external }))).toContain("external-assets");
  });

  it("rejects a local asset reference", () => {
    const body =
      '<script src="/app.js"></script><script type="module">console.log("app")</script><style>body{color:#000}</style>';
    expect(rules(artifact({ body }))).toContain("local-asset");
  });

  it("accepts data, blob and in-page references", () => {
    const body =
      '<img src="data:image/png;base64,AA" alt="inline" />' +
      '<a href="#section">Section</a><a href="blob:https://example.test/1">Blob</a>' +
      '<script type="module">console.log("app")</script><style>body{color:#000}</style>';
    expect(rules(artifact({ body }))).toEqual([]);
  });

  it("rejects a version mismatch", () => {
    const root = artifact({ version: "0.2.0" });
    const packagePath = join(root, "package.json");
    writeFileSync(packagePath, JSON.stringify({ version: "0.1.0" }));
    expect(rules(root)).toContain("identity");
  });

  it("rejects a font without SRI", () => {
    expect(
      rules(artifact({ fontScript: FONT_SCRIPT.replace("integrity:`sha384-test`", "") })),
    ).toContain("external-assets");
  });
});
