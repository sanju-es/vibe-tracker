import { describe, expect, it } from "vitest";
import { resolveLinks } from "../src/lib/markdown/links";
import { parseDocument } from "../src/lib/markdown/pipeline";
import type { Document } from "../src/lib/model/types";

function makeDocument(id: string, source: string): Document {
  const parsed = parseDocument(id, source);
  return {
    id,
    path: id,
    fileName: id.split("/").pop() ?? id,
    title: parsed.sections[0]?.text ?? id,
    scope: id.includes("docs/modules/") ? "module" : "project",
    moduleNumber: null,
    moduleSlug: null,
    category: "other",
    nodes: parsed.blocks,
    sections: parsed.sections,
    tables: parsed.tables,
    meta: parsed.meta,
  };
}

describe("resolveLinks", () => {
  it("resolves document links and keeps valid ones", () => {
    const source = makeDocument("docs/A.md", "See [the other](../B.md).\n");
    const target = makeDocument("B.md", "# B\n");
    const result = resolveLinks([source, target], new Set());
    const paragraph = result.documents[0]?.nodes[0];
    expect(paragraph?.type).toBe("paragraph");
    if (paragraph?.type !== "paragraph") return;
    const run = paragraph.runs.find((entry) => entry.kind === "link");
    expect(run?.linkKind).toBe("document");
    expect(run?.targetPath).toBe("B.md");
    expect(result.brokenLinks).toBe(0);
  });

  it("marks a missing target as broken", () => {
    const source = makeDocument("docs/A.md", "See [missing](../Nope.md).\n");
    const result = resolveLinks([source], new Set());
    const paragraph = result.documents[0]?.nodes[0];
    if (paragraph?.type !== "paragraph") throw new Error("expected paragraph");
    expect(paragraph.runs.find((run) => run.kind === "link")?.linkKind).toBe("broken");
    expect(result.brokenLinks).toBe(1);
  });

  it("resolves image paths without requiring the image to exist", () => {
    const source = makeDocument("docs/modules/01/A.md", "![diagram](../../img/x.png)\n");
    const result = resolveLinks([source], new Set(["docs/img/x.png"]));
    const paragraph = result.documents[0]?.nodes[0];
    if (paragraph?.type !== "paragraph") throw new Error("expected paragraph");
    expect(paragraph.runs[0]?.targetPath).toBe("docs/img/x.png");
  });

  it("does not touch anchors or external links", () => {
    const source = makeDocument(
      "A.md",
      "# Section\n\n[Jump](#section) [Web](https://x.dev)\n",
    );
    const result = resolveLinks([source], new Set());
    const paragraph = result.documents[0]?.nodes[1];
    if (paragraph?.type !== "paragraph") throw new Error("expected paragraph");
    expect(paragraph.runs[0]?.linkKind).toBe("anchor");
    expect(paragraph.runs[2]?.linkKind).toBe("external");
  });
});
