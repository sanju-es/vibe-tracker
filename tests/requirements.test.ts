import { describe, expect, it } from "vitest";
import { buildProject } from "../src/lib/project/build";
import { requirementsCatalog } from "../src/lib/model/requirements";

const STATE = `# PROJECT_STATE.md — Demo

## 6. Module inventory and state

| # | Module | State | Documentation |
|---|---|---|---|
| 1 | Reader | Implemented | \`01-reader\` |
| 2 | Empty | Pending | \`02-empty\` |
`;

const REQUIREMENTS = `# Module 1 — REQUIREMENTS

## 2. Functional requirements

### FR-1 — First requirement

First body.

### FR-2 — Second requirement

Second body.

## 3. Business rules

- **BR-1 — Always do this.**

## 4. Flows

1. Open the thing.

## 5. Validations

- **VAL-1** — Reject the empty value.

## 6. Edge cases

- An empty folder stays empty.

## 8. Dependencies

- None.
`;

const EMPTY_REQUIREMENTS = `# Module 2 — REQUIREMENTS

## 2. Functional requirements

_not recorded._

## 3. Business rules

_not recorded._

## 5. Validations

_not recorded._

## 6. Edge cases

_not recorded._

## 8. Dependencies

- None.
`;

const project = buildProject({
  name: "demo",
  files: [
    { path: "PROJECT_STATE.md", text: STATE },
    { path: "docs/modules/01-reader/MODULE.md", text: "# Module 1 — Reader\n" },
    {
      path: "docs/modules/01-reader/REQUIREMENTS.md",
      text: REQUIREMENTS,
    },
    { path: "docs/modules/02-empty/MODULE.md", text: "# Module 2 — Empty\n" },
    {
      path: "docs/modules/02-empty/REQUIREMENTS.md",
      text: EMPTY_REQUIREMENTS,
    },
  ],
});

const catalogue = requirementsCatalog(project, "No requirements recorded.");

describe("requirements catalogue", () => {
  it("collects every section in source order", () => {
    expect(catalogue.table.headers).toEqual(["Module", "State", "Section", "ID", "Text"]);
    expect(catalogue.table.statusColumn).toBe(1);
    expect(catalogue.table.rows.map((row) => row.cells[2]?.text)).toEqual([
      "Functional requirements",
      "Functional requirements",
      "Business rules",
      "Flows",
      "Validations",
      "Edge cases",
      "—",
    ]);
  });

  it("keeps the functional requirement body and its heading anchor", () => {
    const row = catalogue.table.rows[0];
    expect(row?.cells[0]?.text).toBe("01-reader");
    expect(row?.cells[1]?.text).toBe("Implemented");
    expect(row?.cells[3]?.text).toBe("FR-1");
    expect(row?.cells[4]?.text).toContain("First requirement");
    expect(row?.cells[4]?.text).toContain("First body.");
    const target = catalogue.targets.get(row?.id ?? "");
    expect(target).toMatchObject({
      kind: "item",
      documentId: "docs/modules/01-reader/REQUIREMENTS.md",
    });
    if (target?.kind !== "item") throw new Error("expected item target");
    expect(target.anchor).toContain("fr-1");
  });

  it("keeps identifiers only where the source defines one", () => {
    const ids = catalogue.table.rows
      .filter((row) => row.cells[0]?.text === "01-reader")
      .map((row) => row.cells[3]?.text);
    expect(ids).toEqual(["FR-1", "FR-2", "BR-1", "—", "VAL-1", "—"]);
  });

  it("shows an explicit row for a module without recorded items", () => {
    const row = catalogue.table.rows[6];
    expect(row?.cells[0]?.text).toBe("02-empty");
    expect(row?.cells[1]?.text).toBe("Pending");
    expect(row?.cells[2]?.text).toBe("—");
    expect(row?.cells[3]?.text).toBe("—");
    expect(row?.cells[4]?.text).toBe("No requirements recorded.");
    const target = catalogue.targets.get(row?.id ?? "");
    expect(target).toMatchObject({
      kind: "item",
      documentId: "docs/modules/02-empty/REQUIREMENTS.md",
      anchor: null,
    });
  });

  it("keeps a source target for every list item", () => {
    const row = catalogue.table.rows[4];
    const target = catalogue.targets.get(row?.id ?? "");
    expect(target).toMatchObject({
      kind: "item",
      text: "VAL-1 — Reject the empty value.",
    });
    if (target?.kind !== "item") throw new Error("expected item target");
    expect(target.anchor).toContain("validations");
  });
});
