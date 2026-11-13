import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { InlineRun } from "../src/lib/model/types";
import { buildProject } from "../src/lib/project/build";

const STATE = `# PROJECT_STATE.md — Demo

## 6. Module inventory and state

| # | Module | State | Documentation |
|---|---|---|---|
| 0 | Core | Active (permanent) | \`00-core\` |
| 1 | Structured Reader | Implementation proposal | \`01-structured-reader\` |

**Active module:** 1 — Structured Reader.
`;

const DECISIONS = `# DECISIONS.md — Demo

| # | Date | Decision |
|---|---|---|
| D-01 | 2026-11-13 | First decision |
`;

const REQUIREMENTS = `# Requirements

| Ref | Rule | Status |
|---|---|---|
| FR-1 | D-01 | Pending |
`;

describe("buildProject", () => {
  const project = buildProject({
    name: "demo",
    files: [
      { path: "PROJECT_STATE.md", text: STATE },
      { path: "docs/DECISIONS.md", text: DECISIONS },
      { path: "docs/modules/00-core/MODULE.md", text: "# Module 0 — Core\n" },
      { path: "docs/modules/01-structured-reader/REQUIREMENTS.md", text: REQUIREMENTS },
    ],
  });

  it("classifies documents by scope and category", () => {
    const state = project.documents.find(
      (document) => document.path === "PROJECT_STATE.md",
    );
    expect(state?.scope).toBe("project");
    expect(state?.category).toBe("state");
    const requirements = project.documents.find(
      (document) => document.category === "requirements",
    );
    expect(requirements?.scope).toBe("module");
    expect(requirements?.moduleNumber).toBe(1);
  });

  it("reads the module inventory from the project state", () => {
    expect(project.modules.map((module) => module.name)).toEqual([
      "Core",
      "Structured Reader",
    ]);
    expect(project.modules[0]?.state).toBe("Active (permanent)");
    expect(project.modules[0]?.slug).toBe("core");
  });

  it("resolves row references across documents", () => {
    const requirements = project.documents.find(
      (document) => document.category === "requirements",
    );
    const ref = requirements?.tables[0]?.rows[0]?.cells[1]?.ref;
    expect(ref?.identifier).toBe("D-01");
    expect(ref?.targets[0]?.documentTitle).toContain("DECISIONS");
  });

  it("defaults the document title to its first heading", () => {
    const decisions = project.documents.find(
      (document) => document.category === "decisions",
    );
    expect(decisions?.title).toContain("DECISIONS.md");
  });

  it("categorises the documentation standard and resolves its rule references", () => {
    const standard = readFileSync("docs/DOC-STANDARD.md", "utf8");
    const project = buildProject({
      name: "demo",
      files: [{ path: "docs/DOC-STANDARD.md", text: standard }],
    });
    const document = project.documents[0];
    expect(document?.category).toBe("standard");
    expect(document?.meta.status?.token).toBe("approved");

    const references: string[] = [];
    const visit = (runs: readonly InlineRun[]) => {
      for (const run of runs) {
        if (run.kind === "reference") references.push(run.text);
        if (run.children) visit(run.children);
      }
    };
    for (const node of document?.nodes ?? []) {
      if (node.type === "heading") visit(node.runs);
      if (node.type === "paragraph") visit(node.runs);
      if (node.type === "quote") visit(node.runs);
      if (node.type === "list") node.items.forEach(visit);
    }
    expect(references).toContain("E-04");
    expect(references).toContain("AG-03");
  });

  it("resolves links inside the front block", () => {
    const project = buildProject({
      name: "demo",
      files: [
        {
          path: "docs/DOC-STANDARD.md",
          text: "# Standard\n\n> **Purpose:** see [state](../PROJECT_STATE.md).\n\n**Last update:** 2026-11-13\n",
        },
        { path: "PROJECT_STATE.md", text: "# State\n" },
      ],
    });
    const standard = project.documents.find(
      (document) => document.category === "standard",
    );
    const link = standard?.meta.fields[0]?.runs.find((run) => run.kind === "link");
    expect(link?.linkKind).toBe("document");
    expect(link?.targetPath).toBe("PROJECT_STATE.md");
  });

  it("lists only modules that exist as a local folder with documents", () => {
    const inventory = `# PROJECT_STATE.md — Demo

## 6. Module inventory and state

| # | Module | State | Open items | Documentation |
|---|---|---|---|---|
| 0 | Core | Active (permanent) | — | \`00-core\` |
| 1 | Reader | Implemented | — | \`01-reader\` |
| 9 | Ghost | Pending | — | \`09-ghost\` |
`;
    const project = buildProject({
      name: "demo",
      files: [
        { path: "PROJECT_STATE.md", text: inventory },
        { path: "docs/modules/00-core/MODULE.md", text: "# Module 0 — Core\n" },
        { path: "docs/modules/01-reader/MODULE.md", text: "# Module 1 — Reader\n" },
        { path: "docs/modules/07-extra/MODULE.md", text: "# Module 7 — Extra\n" },
      ],
    });
    expect(project.modules.map((module) => module.number)).toEqual([0, 1, 7]);
  });

  it("collects image references and marks missing ones at render time", () => {
    const withImage = buildProject({
      name: "demo",
      files: [
        {
          path: "docs/modules/01-structured-reader/TECHNICAL.md",
          text: "# Tech\n\n![Diagram](../../assets/diagram.png)\n",
        },
      ],
    });
    expect(withImage.images[0]?.path).toBe("docs/assets/diagram.png");
  });
});
