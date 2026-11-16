import { describe, expect, it } from "vitest";
import type { BlockNode, Document, InlineRun, Table } from "../src/lib/model/types";
import { attachInlineReferences, buildIndex } from "../src/lib/semantics/references";

function makeTable(id: string, headers: string[], values: string[][]): Table {
  return {
    id,
    headers,
    statusColumn: null,
    rows: values.map((cells, index) => ({
      id: `${id}-r${index + 1}`,
      cells: cells.map((text, column) => ({
        column,
        text,
        runs: [{ kind: "text", text }],
        ref: null,
      })),
    })),
  };
}

function document(
  id: string,
  fileName: string,
  moduleNumber: number | null,
  nodes: BlockNode[],
  tables: Table[] = [],
): Document {
  return {
    id,
    path: id,
    fileName,
    title: fileName,
    scope: moduleNumber === null ? "project" : "module",
    moduleNumber,
    moduleSlug: moduleNumber === null ? null : String(moduleNumber),
    category: "other",
    nodes,
    sections: [],
    tables,
    meta: { fields: [], status: null, lastUpdate: null, history: null },
  };
}

function text(value: string): InlineRun {
  return { kind: "text", text: value };
}

function referencesIn(runs: InlineRun[]): string[] {
  const found: string[] = [];
  const visit = (list: InlineRun[]) => {
    for (const run of list) {
      if (run.kind === "reference") found.push(run.text);
      if (run.children) visit(run.children);
    }
  };
  visit(runs);
  return found;
}

const decisions = document(
  "docs/DECISIONS.md",
  "DECISIONS.md",
  null,
  [
    {
      type: "heading",
      level: 2,
      anchor: "approved-decisions",
      runs: [text("1. Approved decisions")],
    },
    { type: "table", tableId: "docs/DECISIONS.md#decisions" },
  ],
  [
    makeTable(
      "docs/DECISIONS.md#decisions",
      ["#", "Date", "Decision"],
      [["D-01", "2026-11-13", "First decision"]],
    ),
  ],
);

const requirements = document(
  "docs/modules/01-structured-reader/REQUIREMENTS.md",
  "REQUIREMENTS.md",
  1,
  [
    {
      type: "heading",
      level: 2,
      anchor: "functional-requirements",
      runs: [text("2. Functional requirements")],
    },
    {
      type: "heading",
      level: 3,
      anchor: "fr-1--first-rule",
      runs: [text("FR-1 — First rule")],
    },
    {
      type: "list",
      ordered: false,
      items: [[text("FR-1"), text(" — See D-01 and the unknown ZZ-9.")]],
    },
    {
      type: "paragraph",
      runs: [text("This rule depends on D-01 twice: D-01, and on E-04.")],
    },
  ],
);

const index = buildIndex([decisions, requirements]);
const documents = attachInlineReferences([decisions, requirements], index);

describe("buildIndex with definitions", () => {
  it("indexes the owner definitions of both namespaces", () => {
    expect(index.has("D-01")).toBe(true);
    expect(index.has("FR-1")).toBe(true);
    const target = index.get("D-01")?.[0];
    expect(target).toMatchObject({
      kind: "row",
      documentId: "docs/DECISIONS.md",
    });
  });
});

describe("attachInlineReferences", () => {
  it("links known identifiers inside running text", () => {
    const paragraph = documents[1]?.nodes[3];
    if (paragraph?.type !== "paragraph") throw new Error("expected paragraph");
    expect(referencesIn(paragraph.runs)).toEqual(["D-01", "D-01"]);
  });

  it("does not link the identifier that defines the heading", () => {
    const heading = documents[1]?.nodes[1];
    if (heading?.type !== "heading") throw new Error("expected heading");
    expect(referencesIn(heading.runs)).toEqual([]);
  });

  it("links a mention inside a list item", () => {
    const list = documents[1]?.nodes[2];
    if (list?.type !== "list") throw new Error("expected list");
    expect(referencesIn(list.items[0] ?? [])).toEqual(["FR-1", "D-01"]);
  });

  it("leaves unknown identifiers and rule ids as text", () => {
    const list = documents[1]?.nodes[2];
    if (list?.type !== "list") throw new Error("expected list");
    expect(referencesIn(list.items[0] ?? [])).not.toContain("ZZ-9");
    const paragraph = documents[1]?.nodes[3];
    if (paragraph?.type !== "paragraph") throw new Error("expected paragraph");
    expect(referencesIn(paragraph.runs)).not.toContain("E-04");
  });

  it("keeps the reference payload pointing at the indexed target", () => {
    const paragraph = documents[1]?.nodes[3];
    if (paragraph?.type !== "paragraph") throw new Error("expected paragraph");
    const reference = paragraph.runs.find((run) => run.kind === "reference");
    expect(reference?.ref?.identifier).toBe("D-01");
    expect(reference?.ref?.targets[0]?.documentId).toBe("docs/DECISIONS.md");
  });
});
