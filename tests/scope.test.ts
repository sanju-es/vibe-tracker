import { describe, expect, it } from "vitest";
import {
  isDocumentationEntry,
  isDocumentationMarkdown,
  isIgnoredDirectory,
  isIgnoredPath,
  kindOf,
} from "../src/lib/fs/scope";

describe("documentation scope", () => {
  it("accepts Markdown at the root and under docs at any depth", () => {
    for (const path of [
      "README.md",
      "AGENTS.md",
      "PROJECT_STATE.md",
      "docs/ARCHITECTURE.md",
      "docs/modules/01-structured-reader/MODULE.md",
      "docs/plans/plan.md",
    ]) {
      expect(isDocumentationMarkdown(path)).toBe(true);
    }
  });

  it("rejects Markdown outside the root and docs", () => {
    for (const path of [
      "src/README.md",
      "tests/fixtures/README.md",
      ".opencode/agents/frontend.md",
      ".github/ISSUE_TEMPLATE.md",
      "node_modules/pkg/readme.md",
      "dist/README.md",
      "docs/.drafts/note.md",
      ".notes.md",
      "project_tracking/PROJECT_STATE.md",
      "package.json",
    ]) {
      expect(isDocumentationMarkdown(path)).toBe(false);
    }
  });

  it("ignores hidden, dependency, tooling and build folders", () => {
    for (const name of [
      ".git",
      ".opencode",
      ".github",
      ".vscode",
      "node_modules",
      "dist",
      "build",
      "coverage",
      "out",
      "tmp",
      "vendor",
    ]) {
      expect(isIgnoredDirectory(name)).toBe(true);
    }
    for (const name of ["docs", "modules", "assets", "src", "tests"]) {
      expect(isIgnoredDirectory(name)).toBe(false);
    }
    expect(isIgnoredPath("docs/modules/01-structured-reader/MODULE.md")).toBe(false);
    expect(isIgnoredPath("docs/node_modules/pkg/readme.md")).toBe(true);
  });

  it("keeps referenced images outside docs but inside the project", () => {
    for (const path of [
      "assets/logo.png",
      "docs/assets/diagram.svg",
      "src/logo.webp",
      "images/photo.JPG",
    ]) {
      expect(isDocumentationEntry(path)).toBe(true);
    }
    for (const path of [
      "node_modules/pkg/logo.png",
      "dist/logo.png",
      ".opencode/logo.png",
      "docs/build/logo.png",
    ]) {
      expect(isDocumentationEntry(path)).toBe(false);
    }
  });

  it("admits only Markdown under the policy and images as scan entries", () => {
    expect(isDocumentationEntry("README.md")).toBe(true);
    expect(isDocumentationEntry("docs/modules/01-structured-reader/MODULE.md")).toBe(
      true,
    );
    expect(isDocumentationEntry("src/README.md")).toBe(false);
    expect(isDocumentationEntry("package.json")).toBe(false);
    expect(isDocumentationEntry("assets/logo.png")).toBe(true);
  });

  it("classifies a path by extension", () => {
    expect(kindOf("docs/DECISIONS.md")).toBe("markdown");
    expect(kindOf("assets/diagram.SVG")).toBe("image");
    expect(kindOf("scripts/docs-audit.mjs")).toBe("other");
  });
});
