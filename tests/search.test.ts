import { describe, expect, it } from "vitest";
import { buildProject } from "../src/lib/project/build";
import { documentIndex, searchProject } from "../src/lib/model/search";

const STATE = `# PROJECT_STATE.md — Demo

> **Purpose:** Alpha phrase in the front block.

**Last update:** 2026-11-16

## Alpha phrase section

Body with ALPHA PHRASE and more text.

- Item with alpha phrase.

| A | B |
|---|---|
| alpha phrase | other |

## Other

La información está aquí.
`;

const DECISIONS = `# DECISIONS.md — Demo

## 1. Approved decisions

Another alpha phrase in a decision.
`;

const ARCHITECTURE = `# ARCHITECTURE.md — Demo

## 1. Overview

Nothing to see here.
`;

const project = buildProject({
  name: "demo",
  files: [
    { path: "PROJECT_STATE.md", text: STATE },
    { path: "docs/DECISIONS.md", text: DECISIONS },
    { path: "docs/ARCHITECTURE.md", text: ARCHITECTURE },
    {
      path: "docs/modules/01-reader/MODULE.md",
      text: `# Module 1 — Reader

## 1. Purpose

A module with alpha phrase.
`,
    },
  ],
});

describe("global search", () => {
  it("finds the phrase across documents, case-insensitively", () => {
    const groups = searchProject(project, "alpha PHRASE");
    expect(groups.map((group) => group.documentId)).toEqual([
      "PROJECT_STATE.md",
      "docs/DECISIONS.md",
      "docs/modules/01-reader/MODULE.md",
    ]);
    const state = groups[0];
    expect(state?.matches.some((match) => match.kind === "heading")).toBe(true);
    expect(state?.matches.some((match) => match.kind === "body")).toBe(true);
    expect(state?.matches.some((match) => match.kind === "table")).toBe(true);
    expect(state?.matches.some((match) => match.kind === "front-block")).toBe(true);
  });

  it("puts heading matches before body matches and keeps the excerpt", () => {
    const matches = searchProject(project, "alpha phrase")[0]?.matches ?? [];
    expect(matches[0]?.kind).toBe("heading");
    const body = matches.find((match) => match.kind === "body");
    expect(body?.match).toBe("ALPHA PHRASE");
    expect(body?.before.length).toBeGreaterThanOrEqual(0);
    expect(body?.after).toContain("and more text");
  });

  it("keeps a table row id and the section anchor", () => {
    const table = searchProject(project, "alpha phrase")
      .flatMap((group) => group.matches)
      .find((match) => match.kind === "table");
    expect(table?.rowId).toBe("PROJECT_STATE.md#table-1-r1");
    expect(table?.anchor).toBe("alpha-phrase-section");
    expect(table?.match).toBe("alpha phrase");
  });

  it("ignores accents and keeps the original excerpt", () => {
    const match = searchProject(project, "informacion")[0]?.matches[0];
    expect(match?.match).toBe("información");
  });

  it("returns no groups for an empty or whitespace query", () => {
    expect(searchProject(project, "")).toEqual([]);
    expect(searchProject(project, "   ")).toEqual([]);
  });

  it("returns no groups when nothing matches", () => {
    expect(searchProject(project, "zzzz")).toEqual([]);
  });
});

describe("document index", () => {
  it("groups documents by category in the catalogue order", () => {
    const groups = documentIndex(project);
    expect(groups.map((group) => group.category)).toEqual([
      "state",
      "architecture",
      "decisions",
      "module-summary",
    ]);
    expect(groups[0]?.documents[0]?.title).toBe("PROJECT_STATE.md — Demo");
  });

  it("includes every document exactly once", () => {
    const paths = documentIndex(project).flatMap((group) =>
      group.documents.map((document) => document.id),
    );
    expect(paths.sort()).toEqual(
      [
        "PROJECT_STATE.md",
        "docs/ARCHITECTURE.md",
        "docs/DECISIONS.md",
        "docs/modules/01-reader/MODULE.md",
      ].sort(),
    );
  });
});
