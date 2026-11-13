import { describe, expect, it } from "vitest";
import { parseModuleInventory } from "../src/lib/model/inventory";

const STATE = `# PROJECT_STATE.md — Demo

## 5. Quick links

- Something

| # | Module | State | Documentation |
|---|---|---|---|
| 9 | NotThis | Pending | x |

## 6. Module inventory and state

| # | Module | State | Documentation |
|---|---|---|---|
| 0 | Core | Active (permanent) | \`00-core\` |
| 1 | Structured Reader | Implementation proposal | \`01-structured-reader\` |
| 2 | Backlog Board | Pending | \`02-backlog-board\` |

**Active module:** 1 — Structured Reader.
`;

describe("parseModuleInventory", () => {
  it("reads only the inventory section", () => {
    const modules = parseModuleInventory(STATE);
    expect(modules.map((module) => module.number)).toEqual([0, 1, 2]);
    expect(modules[0]?.name).toBe("Core");
    expect(modules[0]?.state).toBe("Active (permanent)");
    expect(modules[2]?.name).toBe("Backlog Board");
  });

  it("returns an empty list when the section is missing", () => {
    expect(
      parseModuleInventory("# Nothing here\n\n| # | A |\n|---|---|\n| 1 | x |\n"),
    ).toEqual([]);
  });

  it("keeps the inventory when names contain markup", () => {
    const source = `## 6. Mods

| # | Module | State | Docs |
|---|---|---|---|
| 3 | \`Odd\` module | **Pending** | x |
`;
    const modules = parseModuleInventory(source);
    expect(modules[0]?.name).toBe("Odd module");
    expect(modules[0]?.state).toBe("Pending");
  });
});
