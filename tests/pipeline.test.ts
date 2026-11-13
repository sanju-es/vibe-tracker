import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseDocument, classifyHref } from "../src/lib/markdown/pipeline";

const state = readFileSync("PROJECT_STATE.md", "utf8");
const decisions = readFileSync("docs/DECISIONS.md", "utf8");
const backlog = readFileSync("docs/modules/00-core/BACKLOG.md", "utf8");
const standard = readFileSync("docs/DOC-STANDARD.md", "utf8");
const moduleDoc = readFileSync("docs/modules/01-structured-reader/MODULE.md", "utf8");

describe("parseDocument", () => {
  it("reads the front block, status and last update of the standard", () => {
    const parsed = parseDocument("docs/DOC-STANDARD.md", standard);
    expect(parsed.meta.fields.map((field) => field.key)).toEqual([
      "Purpose",
      "Read when",
      "Canonical for",
      "Do not duplicate",
    ]);
    expect(parsed.meta.status).toEqual({ token: "approved", date: "2026-11-13" });
    expect(parsed.meta.lastUpdate).toBe("2026-11-13");
    expect(parsed.blocks[0]).toMatchObject({ type: "heading", level: 1 });
    expect(parsed.blocks.some((node) => node.type === "quote")).toBe(false);
  });

  it("reads the metadata of a module document", () => {
    const parsed = parseDocument(
      "docs/modules/01-structured-reader/MODULE.md",
      moduleDoc,
    );
    expect(parsed.meta.fields).toHaveLength(4);
    expect(parsed.meta.status?.token).toBe("Implemented");
    expect(parsed.meta.lastUpdate).toBe("2026-11-13");
  });

  it("turns <br> into a break run inside a cell", () => {
    const parsed = parseDocument("x.md", "| A |\n|---|\n| x<br>y |\n");
    const runs = parsed.tables[0]?.rows[0]?.cells[0]?.runs ?? [];
    expect(runs.some((run) => run.kind === "break")).toBe(true);
    expect(runs.some((run) => run.kind === "text" && run.text.includes("<br>"))).toBe(
      false,
    );
  });

  it("builds sections with unique anchors from a real document", () => {
    const parsed = parseDocument("PROJECT_STATE.md", state);
    expect(parsed.sections.length).toBeGreaterThan(5);
    const anchors = parsed.sections.map((section) => section.anchor);
    expect(new Set(anchors).size).toBe(anchors.length);
    expect(parsed.sections[0]?.text).toContain("PROJECT_STATE.md");
  });

  it("detects the module inventory status column", () => {
    const parsed = parseDocument("PROJECT_STATE.md", state);
    const inventory = parsed.tables.find((table) => table.headers[0] === "#");
    expect(inventory?.statusColumn).toBe(2);
    expect(inventory?.rows.length).toBeGreaterThan(3);
  });

  it("keeps table rows and statuses of the decisions log", () => {
    const parsed = parseDocument("docs/DECISIONS.md", decisions);
    const table = parsed.tables[0];
    expect(table?.headers[0]).toBe("#");
    expect(table?.statusColumn).toBeNull();
    expect(table?.rows[0]?.cells[0]?.text).toBe("D-01");
  });

  it("parses the core backlog with its registered columns", () => {
    const parsed = parseDocument("docs/modules/00-core/BACKLOG.md", backlog);
    expect(parsed.tables).toHaveLength(1);
    expect(parsed.tables[0]?.statusColumn).toBe(6);
    expect(parsed.tables[0]?.rows).toHaveLength(16);
    expect(parsed.tables[0]?.rows[0]?.cells[0]?.text).toBe("CORE-01");
    expect(parsed.tables[0]?.rows[15]?.cells[0]?.text).toBe("CORE-16");
  });

  it("never produces HTML blocks for ordinary Markdown", () => {
    const parsed = parseDocument("x.md", "# Title\n\nText **bold** and `code`.\n");
    expect(parsed.blocks.some((node) => node.type === "unknown")).toBe(false);
  });

  it("de-duplicates anchors that repeat", () => {
    const parsed = parseDocument("x.md", "# Same\n\n## Same\n\n## Same\n");
    expect(parsed.sections.map((section) => section.anchor)).toEqual([
      "same",
      "same-2",
      "same-3",
    ]);
  });
});

describe("classifyHref", () => {
  it("classifies the link kinds used by the project", () => {
    expect(classifyHref("#section")).toBe("anchor");
    expect(classifyHref("../00-core/MODULE.md#purpose")).toBe("document");
    expect(classifyHref("images/diagram.png")).toBe("image");
    expect(classifyHref("https://example.com")).toBe("external");
    expect(classifyHref("mailto:team@example.com")).toBe("external");
    expect(classifyHref("data/x.json")).toBe("broken");
  });
});
