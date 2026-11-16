import { describe, expect, it } from "vitest";
import { buildProject } from "../src/lib/project/build";
import { dashboardSummary } from "../src/lib/model/dashboard";

const STATE = `# PROJECT_STATE.md — Demo

## 6. Module inventory and state

| # | Module | State | Documentation |
|---|---|---|---|
| 0 | Core | Active (permanent) | \`00-core\` |
| 1 | One | Tested | \`01-one\` |
| 2 | Two | Pending | \`02-two\` |
| 3 | Three | In development | \`03-three\` |

**Active module:** 2 — Two (\`docs/modules/02-two/\`), state \`Pending\`.
`;

function moduleDoc(number: number, update: string): string {
  return `# Module ${number} — Demo

**Last update:** ${update}

Body.
`;
}

function changelog(number: number, entries: string[]): string {
  return `# Module ${number} — CHANGELOG

> Dated history only.
**History:** append-only.

${entries.map((entry) => `## ${entry}\n\n- Change.\n`).join("\n")}
`;
}

const project = buildProject({
  name: "demo",
  files: [
    { path: "PROJECT_STATE.md", text: STATE },
    { path: "docs/modules/00-core/MODULE.md", text: moduleDoc(0, "2026-11-16") },
    {
      path: "docs/modules/00-core/CHANGELOG.md",
      text: changelog(0, ["2026-11-15 — Core change"]),
    },
    { path: "docs/modules/01-one/MODULE.md", text: moduleDoc(1, "2026-11-16") },
    {
      path: "docs/modules/01-one/CHANGELOG.md",
      text: changelog(1, ["2026-11-14 — First", "2026-11-16 — Latest"]),
    },
    { path: "docs/modules/02-two/MODULE.md", text: moduleDoc(2, "2026-11-15") },
    {
      path: "docs/modules/02-two/CHANGELOG.md",
      text: changelog(2, ["Undated entry", "2026-11-15 — Second"]),
    },
    { path: "docs/modules/03-three/MODULE.md", text: moduleDoc(3, "2026-11-14") },
  ],
});

const summary = dashboardSummary(project);

describe("dashboard summary", () => {
  it("counts closable modules by documented state and keeps Core separate", () => {
    expect(summary.modules.map((module) => module.number)).toEqual([1, 2, 3]);
    expect(summary.core).toMatchObject({
      number: 0,
      state: "Active (permanent)",
      stateKey: "active",
    });
    expect(summary.counts).toEqual({
      total: 3,
      tested: 1,
      inProgress: 1,
      pending: 1,
      blocked: 0,
      other: 0,
    });
  });

  it("derives progress only from the Tested count", () => {
    expect(summary.progress).toEqual({ tested: 1, total: 3, percent: 33 });
  });

  it("marks the active module and reads the last update", () => {
    expect(summary.modules.map((module) => module.active)).toEqual([false, true, false]);
    expect(summary.modules[0]?.lastUpdate).toBe("2026-11-16");
  });

  it("orders dated changelog entries newest first and skips undated headings", () => {
    expect(summary.timeline.map((entry) => entry.date)).toEqual([
      "2026-11-16",
      "2026-11-15",
      "2026-11-15",
      "2026-11-14",
    ]);
    expect(summary.timeline.map((entry) => entry.moduleNumber)).toEqual([1, 0, 2, 1]);
    expect(summary.timeline.every((entry) => entry.title !== "Undated entry")).toBe(true);
  });

  it("keeps a source target for a timeline entry", () => {
    const entry = summary.timeline[0];
    expect(entry?.target).toMatchObject({
      kind: "item",
      documentId: "docs/modules/01-one/CHANGELOG.md",
      moduleNumber: 1,
    });
    expect(entry?.target.anchor).toContain("2026-11-16");
  });

  it("leaves every row inactive when the active module is none", () => {
    const none = buildProject({
      name: "none",
      files: [
        {
          path: "PROJECT_STATE.md",
          text: `# PROJECT_STATE.md — None

## 6. Module inventory and state

| # | Module | State | Documentation |
|---|---|---|---|
| 0 | Core | Active (permanent) | \`00-core\` |
| 1 | One | Pending | \`01-one\` |

**Active module:** none. Modules are closed.
`,
        },
        { path: "docs/modules/00-core/MODULE.md", text: moduleDoc(0, "2026-11-16") },
        { path: "docs/modules/01-one/MODULE.md", text: moduleDoc(1, "2026-11-16") },
      ],
    });
    expect(dashboardSummary(none).modules.every((module) => !module.active)).toBe(true);
  });

  it("handles a project with Core only", () => {
    const coreOnly = buildProject({
      name: "core",
      files: [
        {
          path: "PROJECT_STATE.md",
          text: `# PROJECT_STATE.md — Core

## 6. Module inventory and state

| # | Module | State | Documentation |
|---|---|---|---|
| 0 | Core | Active (permanent) | \`00-core\` |
`,
        },
        { path: "docs/modules/00-core/MODULE.md", text: moduleDoc(0, "2026-11-16") },
      ],
    });
    const coreSummary = dashboardSummary(coreOnly);
    expect(coreSummary.modules).toEqual([]);
    expect(coreSummary.progress).toEqual({ tested: 0, total: 0, percent: 0 });
    expect(coreSummary.timeline).toEqual([]);
  });
});
