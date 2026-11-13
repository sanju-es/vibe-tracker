import { describe, expect, it } from "vitest";
import { buildProject } from "../src/lib/project/build";
import {
  backlogStatusKeys,
  backlogSummary,
  moduleBacklog,
  moduleBacklogCounts,
  moduleByNumber,
  moduleDocuments,
} from "../src/lib/model/selectors";

const STATE = `# PROJECT_STATE.md — Demo

## 6. Module inventory and state

| # | Module | State | Documentation |
|---|---|---|---|
| 1 | Demo Reader | Implemented | \`01-demo-reader\` |
| 2 | Empty Module | Pending | \`02-empty-module\` |
| 3 | Mixed Module | Pending | \`03-mixed-module\` |
`;

const BACKLOG = `# Module 1 — BACKLOG

| ID | Date | Type | Description | Origin | Priority | Status |
|---|---|---|---|---|---|---|
| B-01 | 2026-11-13 | improvement | First fix | Owner | low | new |
| B-02 | 2026-11-13 | improvement | Second fix | Owner | low | in progress |
`;

const BACKLOG_MIXED = `# Module 3 — BACKLOG

| ID | Date | Type | Description | Origin | Priority | Status |
|---|---|---|---|---|---|---|
| B-01 | 2026-11-13 | correction | Done item | Owner | low | implemented (2026-11-12) |
| B-02 | 2026-11-13 | correction | Rejected item | Owner | low | discarded |
| B-03 | 2026-11-13 | correction | Waiting item | Owner | low | blocked |
| B-04 | 2026-11-13 | correction | Unknown state | Owner | low | on hold |
`;

const project = buildProject({
  name: "demo",
  files: [
    { path: "PROJECT_STATE.md", text: STATE },
    { path: "docs/modules/01-demo-reader/MODULE.md", text: "# Module 1 — Demo Reader\n" },
    { path: "docs/modules/01-demo-reader/BACKLOG.md", text: BACKLOG },
    {
      path: "docs/modules/02-empty-module/MODULE.md",
      text: "# Module 2 — Empty Module\n",
    },
    {
      path: "docs/modules/03-mixed-module/MODULE.md",
      text: "# Module 3 — Mixed Module\n",
    },
    {
      path: "docs/modules/03-mixed-module/BACKLOG.md",
      text: BACKLOG_MIXED,
    },
  ],
});

describe("module selectors", () => {
  it("finds a module by number", () => {
    expect(moduleByNumber(project, 1)?.name).toBe("Demo Reader");
    expect(moduleByNumber(project, 9)).toBeNull();
  });

  it("lists the documents of a module", () => {
    expect(
      moduleDocuments(project, 1)
        .map((document) => document.fileName)
        .sort(),
    ).toEqual(["BACKLOG.md", "MODULE.md"]);
  });

  it("returns the backlog document and its tables", () => {
    const backlog = moduleBacklog(project, 1);
    expect(backlog?.document.category).toBe("backlog");
    expect(backlog?.tables).toHaveLength(1);
    expect(backlog?.tables[0]?.rows).toHaveLength(2);
    expect(backlog?.tables[0]?.statusColumn).toBe(6);
  });

  it("returns null when the module has no backlog", () => {
    expect(moduleBacklog(project, 2)).toBeNull();
  });

  it("counts all and per-status backlog items", () => {
    expect(moduleBacklogCounts(project, 1)).toEqual({
      all: 2,
      byStatus: { new: 1, "in-progress": 1 },
    });
    expect(moduleBacklogCounts(project, 2)).toEqual({ all: 0, byStatus: {} });
    expect(moduleBacklogCounts(project, 3)).toEqual({
      all: 4,
      byStatus: { implemented: 1, discarded: 1, blocked: 1 },
    });
  });

  it("lists every backlog status in vocabulary order", () => {
    expect(backlogStatusKeys(project)).toEqual([
      "implemented",
      "blocked",
      "new",
      "in-progress",
      "discarded",
    ]);
  });

  it("builds the new and accepted backlog summary with source targets", () => {
    const summary = backlogSummary(project);
    expect(summary.table.headers).toEqual([
      "Module",
      "ID",
      "Date",
      "Type",
      "Description",
      "Origin",
      "Priority",
      "Status",
    ]);
    expect(summary.table.rows).toHaveLength(2);
    expect(summary.table.rows[0]?.cells[0]?.text).toBe("01-demo-reader");
    expect(summary.table.rows[0]?.cells[1]?.text).toBe("B-01");
    expect(summary.table.rows[0]?.cells[7]?.text).toBe("new");
    expect(summary.table.rows[1]?.cells[7]?.text).toBe("in progress");
    const target = summary.targets.get(summary.table.rows[0]?.id ?? "");
    expect(target?.documentId).toBe("docs/modules/01-demo-reader/BACKLOG.md");
  });
});
