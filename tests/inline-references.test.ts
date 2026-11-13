import { describe, expect, it } from "vitest";
import type { BlockNode, Document, InlineRun } from "../src/lib/model/types";
import { attachInlineReferences, buildIndex } from "../src/lib/semantics/references";

function document(id: string, nodes: BlockNode[]): Document {
  return {
    id,
    path: id,
    fileName: id.split("/").pop() ?? id,
    title: id,
    scope: "project",
    moduleNumber: null,
    moduleSlug: null,
    category: "other",
    nodes,
    sections: [],
    tables: [],
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

const definitions = document("docs/DECISIONS.md", [
  { type: "heading", level: 2, anchor: "decisions", runs: [text("Decisions")] },
  {
    type: "list",
    ordered: false,
    items: [[text("D-01"), text(" — First decision.")]],
  },
]);

const requirements = document("docs/modules/01/R.md", [
  { type: "heading", level: 2, anchor: "rules", runs: [text("Rules")] },
  {
    type: "list",
    ordered: false,
    items: [[text("FR-1"), text(" — See D-01 and the unknown ZZ-9.")]],
  },
  { type: "paragraph", runs: [text("This rule depends on D-01 twice: D-01.")] },
]);

describe("buildIndex with list items", () => {
  it("indexes a list item that starts with an identifier", () => {
    const index = buildIndex([definitions, requirements]);
    expect(index.has("D-01")).toBe(true);
    expect(index.has("FR-1")).toBe(true);
    const target = index.get("D-01")?.[0];
    expect(target?.kind).toBe("item");
    if (target?.kind !== "item") return;
    expect(target.text).toContain("First decision");
    expect(target.anchor).toBe("decisions");
    expect(target.sectionTitle).toBe("Decisions");
  });
});

describe("attachInlineReferences", () => {
  const index = buildIndex([definitions, requirements]);
  const documents = attachInlineReferences([definitions, requirements], index);

  it("links known identifiers inside running text", () => {
    const paragraph = documents[1]?.nodes[2];
    if (paragraph?.type !== "paragraph") throw new Error("expected paragraph");
    expect(referencesIn(paragraph.runs)).toEqual(["D-01", "D-01"]);
    const kinds = paragraph.runs.map((run) => run.kind);
    expect(kinds).toContain("reference");
  });

  it("does not link the identifier that defines an item", () => {
    const list = documents[1]?.nodes[1];
    if (list?.type !== "list") throw new Error("expected list");
    expect(referencesIn(list.items[0] ?? [])).toEqual(["D-01"]);
  });

  it("leaves unknown identifiers as text", () => {
    const list = documents[1]?.nodes[1];
    if (list?.type !== "list") throw new Error("expected list");
    expect(referencesIn(list.items[0] ?? [])).not.toContain("ZZ-9");
  });

  it("keeps the reference payload pointing at the indexed target", () => {
    const paragraph = documents[1]?.nodes[2];
    if (paragraph?.type !== "paragraph") throw new Error("expected paragraph");
    const reference = paragraph.runs.find((run) => run.kind === "reference");
    expect(reference?.ref?.identifier).toBe("D-01");
    expect(reference?.ref?.targets[0]?.documentId).toBe("docs/DECISIONS.md");
  });
});
