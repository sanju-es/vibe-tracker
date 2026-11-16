import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Cell, Document, Row, Table } from "../src/lib/model/types";
import { parseDocument } from "../src/lib/markdown/pipeline";
import {
  attachInlineReferences,
  attachReferences,
  buildIndex,
  duplicateIdentifiers,
  isIdentifier,
  resolveRelative,
  resolveTargets,
} from "../src/lib/semantics/references";

function cell(column: number, text: string): Cell {
  return { column, text, runs: [{ kind: "text", text }], ref: null };
}

function row(id: string, values: string[]): Row {
  return { id, cells: values.map((value, index) => cell(index, value)) };
}

function document(
  id: string,
  title: string,
  table: Table,
  moduleNumber: number | null = null,
  nodes: Document["nodes"] = [],
): Document {
  return {
    id,
    path: id,
    fileName: id.split("/").pop() ?? id,
    title,
    scope: moduleNumber === null ? "project" : "module",
    moduleNumber,
    moduleSlug: moduleNumber === null ? null : String(moduleNumber),
    category: "other",
    nodes,
    sections: [],
    tables: [table],
    meta: { fields: [], status: null, lastUpdate: null, history: null },
  };
}

function heading(text: string, anchor: string): Document["nodes"][number] {
  return { type: "heading", level: 3, anchor, runs: [{ kind: "text", text }] };
}

const decisions = document("docs/DECISIONS.md", "Decisions", {
  id: "docs/DECISIONS.md#table-1",
  headers: ["#", "Date", "Decision"],
  statusColumn: null,
  rows: [row("docs/DECISIONS.md#table-1-r1", ["D-04", "2026-11-13", "Read-only access"])],
});

const requirements = document("docs/modules/01/R.md", "Requirements", {
  id: "docs/modules/01/R.md#table-1",
  headers: ["Ref", "Text", "Status"],
  statusColumn: 2,
  rows: [
    row("docs/modules/01/R.md#table-1-r1", ["FR-1", "D-04", "Pending"]),
    row("docs/modules/01/R.md#table-1-r2", ["FR-2", "Other rule", "Pending"]),
  ],
});

describe("identifier rules", () => {
  it("accepts the documented identifier shapes", () => {
    for (const value of ["D-04", "FR-3", "CORE-08", "CR-01", "V-2"]) {
      expect(isIdentifier(value)).toBe(true);
    }
  });

  it("rejects prose, lowercase and long numbers", () => {
    for (const value of ["see D-04", "d-04", "D-1234", "04", ""]) {
      expect(isIdentifier(value)).toBe(false);
    }
  });
});

describe("reference index", () => {
  it("indexes first-column identifiers only", () => {
    const index = buildIndex([decisions, requirements]);
    expect([...index.keys()].sort()).toEqual(["D-04", "FR-1", "FR-2"]);
  });

  it("attaches a reference to an exact match in another document", () => {
    const index = buildIndex([decisions, requirements]);
    const [withReferences] = attachReferences([requirements], index);
    const target = withReferences?.tables[0]?.rows[0]?.cells[1];
    expect(target?.ref?.identifier).toBe("D-04");
    expect(target?.ref?.targets[0]?.documentId).toBe("docs/DECISIONS.md");
  });

  it("does not reference the identifier cell itself", () => {
    const index = buildIndex([decisions, requirements]);
    const [withReferences] = attachReferences([decisions], index);
    expect(withReferences?.tables[0]?.rows[0]?.cells[0]?.ref).toBeNull();
  });

  it("ignores prose that contains an identifier", () => {
    const prose = document("docs/P.md", "Prose", {
      id: "docs/P.md#table-1",
      headers: ["Text"],
      statusColumn: null,
      rows: [row("docs/P.md#table-1-r1", ["See D-04 for details"])],
    });
    const index = buildIndex([decisions, prose]);
    const [withReferences] = attachReferences([prose], index);
    expect(withReferences?.tables[0]?.rows[0]?.cells[0]?.ref).toBeNull();
  });

  it("reports duplicates instead of choosing one", () => {
    const duplicate = document("docs/Q.md", "Other", {
      id: "docs/Q.md#table-1",
      headers: ["#", "Text"],
      statusColumn: null,
      rows: [row("docs/Q.md#table-1-r1", ["D-04", "Duplicate id"])],
    });
    const index = buildIndex([decisions, duplicate]);
    expect(duplicateIdentifiers(index)).toEqual(["D-04"]);
    const [withReferences] = attachReferences([requirements], index);
    expect(withReferences?.tables[0]?.rows[0]?.cells[1]?.ref?.targets).toHaveLength(2);
  });
});

describe("heading definitions", () => {
  const emptyTable = (id: string): Table => ({
    id: `${id}#table-1`,
    headers: ["ID", "Text"],
    statusColumn: null,
    rows: [],
  });

  const requirements = document(
    "docs/modules/01/R.md",
    "Requirements",
    emptyTable("docs/modules/01/R.md"),
    1,
    [heading("FR-3 — Reload", "fr-3--reload"), heading("Notes", "notes")],
  );

  it("indexes a heading that starts with an identifier", () => {
    const index = buildIndex([requirements]);
    expect(index.get("FR-3")?.[0]).toMatchObject({
      kind: "item",
      documentId: "docs/modules/01/R.md",
      anchor: "fr-3--reload",
      text: "FR-3 — Reload",
    });
  });

  it("does not link the identifier of the defining heading to itself", () => {
    const [withReferences] = attachInlineReferences(
      [requirements],
      buildIndex([requirements]),
    );
    const first = withReferences?.nodes[0];
    expect(first?.type).toBe("heading");
    const runs = first && "runs" in first ? first.runs : [];
    expect(runs.some((run) => run.kind === "reference")).toBe(false);
  });

  it("links a mention of a heading identifier from the same module", () => {
    const technical = document(
      "docs/modules/01/T.md",
      "Technical",
      emptyTable("docs/modules/01/T.md"),
      1,
      [{ type: "paragraph", runs: [{ kind: "text", text: "See FR-3." }] }],
    );
    const index = buildIndex([requirements, technical]);
    const [withReferences] = attachInlineReferences([technical], index);
    const first = withReferences?.nodes[0];
    const runs = first && "runs" in first ? first.runs : [];
    expect(
      runs.some((run) => run.kind === "reference" && run.ref?.identifier === "FR-3"),
    ).toBe(true);
  });

  it("resolves the requirements of module 1 from the real document", () => {
    const path = "docs/modules/01-structured-reader/REQUIREMENTS.md";
    const parsed = parseDocument(path, readFileSync(path, "utf8"));
    const real: Document = {
      id: path,
      path,
      fileName: "REQUIREMENTS.md",
      title: "Module 1 — REQUIREMENTS",
      scope: "module",
      moduleNumber: 1,
      moduleSlug: "01-structured-reader",
      category: "requirements",
      nodes: parsed.blocks,
      sections: parsed.sections,
      tables: parsed.tables,
      meta: parsed.meta,
    };
    const index = buildIndex([real]);
    const target = resolveTargets("FR-6", 1, index)[0];
    const heading = parsed.sections.find((section) => section.text.startsWith("FR-6 "));
    expect(target).toMatchObject({
      kind: "item",
      text: "FR-6 — Interactive tables",
    });
    const anchor = target && target.kind === "item" ? target.anchor : undefined;
    expect(anchor).toBe(heading?.anchor);
  });
});

describe("reference scope", () => {
  const moduleOne = document(
    "docs/modules/01/R.md",
    "Module 1",
    {
      id: "docs/modules/01/R.md#table-1",
      headers: ["ID", "Text"],
      statusColumn: null,
      rows: [row("docs/modules/01/R.md#table-1-r1", ["FR-1", "Local rule"])],
    },
    1,
  );
  const moduleTwo = document(
    "docs/modules/02/R.md",
    "Module 2",
    {
      id: "docs/modules/02/R.md#table-1",
      headers: ["ID", "Text"],
      statusColumn: null,
      rows: [row("docs/modules/02/R.md#table-1-r1", ["FR-1", "Other rule"])],
    },
    2,
  );
  const project = document("docs/DECISIONS.md", "Decisions", {
    id: "docs/DECISIONS.md#table-1",
    headers: ["#", "Text"],
    statusColumn: null,
    rows: [row("docs/DECISIONS.md#table-1-r1", ["D-01", "Global decision"])],
  });
  const index = buildIndex([moduleOne, moduleTwo, project]);

  it("prefers the same module for a module identifier", () => {
    const targets = resolveTargets("FR-1", 1, index);
    expect(targets.map((target) => target.documentId)).toEqual(["docs/modules/01/R.md"]);
  });

  it("falls back to project level for a module identifier with no local match", () => {
    const targets = resolveTargets("D-01", 1, index);
    expect(targets.map((target) => target.documentId)).toEqual(["docs/DECISIONS.md"]);
  });

  it("does not resolve another module from a project document", () => {
    expect(resolveTargets("FR-1", null, index)).toEqual([]);
  });

  it("honours an explicit module qualifier", () => {
    const targets = resolveTargets("FR-1", null, index, 2);
    expect(targets.map((target) => target.documentId)).toEqual(["docs/modules/02/R.md"]);
  });

  it("resolves global namespaces from any scope", () => {
    expect(resolveTargets("D-01", 2, index)).toHaveLength(1);
  });

  it("prefers the project definition over a module gloss", () => {
    const gloss = document(
      "docs/modules/01/MODULE.md",
      "Module 1",
      {
        id: "docs/modules/01/MODULE.md#table-1",
        headers: ["Decision", "Gloss"],
        statusColumn: null,
        rows: [row("docs/modules/01/MODULE.md#table-1-r1", ["D-01", "Gloss row"])],
      },
      1,
    );
    const scoped = buildIndex([project, gloss]);
    const targets = resolveTargets("D-01", 1, scoped);
    expect(targets).toHaveLength(1);
    expect(targets[0]?.documentId).toBe("docs/DECISIONS.md");
  });

  it("prefers the list-item definition over a secondary table row", () => {
    const moduleDoc = document(
      "docs/modules/01/R.md",
      "Module 1",
      {
        id: "docs/modules/01/R.md#table-1",
        headers: ["FR", "Criterion"],
        statusColumn: null,
        rows: [row("docs/modules/01/R.md#table-1-r1", ["FR-1", "Criterion row"])],
      },
      1,
    );
    const withDefinition: Document = {
      ...moduleDoc,
      nodes: [
        {
          type: "list",
          ordered: false,
          items: [[{ kind: "text", text: "FR-1 - Local rule." }]],
        },
      ],
    };
    const targets = resolveTargets("FR-1", 1, buildIndex([withDefinition]));
    expect(targets).toHaveLength(1);
    expect(targets[0]?.kind).toBe("item");
  });

  it("links every identifier inside one table cell", () => {
    const source = document(
      "docs/modules/01/R.md",
      "Module 1",
      {
        id: "docs/modules/01/R.md#table-1",
        headers: ["ID", "Origin"],
        statusColumn: null,
        rows: [row("docs/modules/01/R.md#table-1-r1", ["FR-1", "D-01 and FR-1"])],
      },
      1,
    );
    const withReferences = attachInlineReferences([source, project], index)[0];
    const runs = withReferences?.tables[0]?.rows[0]?.cells[1]?.runs ?? [];
    const identifiers = runs
      .filter((run) => run.kind === "reference")
      .map((run) => run.text);
    expect(identifiers).toEqual(["D-01", "FR-1"]);
  });

  it("resolves a qualified reference to another module's backlog", () => {
    const moduleSix = document(
      "docs/modules/06/D/BACKLOG.md",
      "Module 6 backlog",
      {
        id: "docs/modules/06/D/BACKLOG.md#table-1",
        headers: ["ID", "Description"],
        statusColumn: null,
        rows: [row("docs/modules/06/D/BACKLOG.md#table-1-r1", ["B-01", "Pending item"])],
      },
      6,
    );
    const projectDoc: Document = {
      ...document("PROJECT_STATE.md", "State", {
        id: "PROJECT_STATE.md#table-1",
        headers: ["Key", "Value"],
        statusColumn: null,
        rows: [],
      }),
      nodes: [
        {
          type: "paragraph",
          runs: [{ kind: "text", text: "See 06 B-01 for the pending work." }],
        },
      ],
    };
    const [withReferences] = attachInlineReferences(
      [projectDoc, moduleSix],
      buildIndex([projectDoc, moduleSix]),
    );
    const paragraph = withReferences?.nodes[0];
    if (paragraph?.type !== "paragraph") throw new Error("expected paragraph");
    const reference = paragraph.runs.find((run) => run.kind === "reference");
    expect(reference?.text).toBe("06 B-01");
    expect(reference?.ref?.targets[0]?.moduleNumber).toBe(6);
  });

  it("links several identifiers inside one code span", () => {
    const source = document(
      "docs/modules/01/R.md",
      "Module 1",
      {
        id: "docs/modules/01/R.md#table-1",
        headers: ["ID", "Text"],
        statusColumn: null,
        rows: [],
      },
      1,
    );
    const withParagraph: Document = {
      ...source,
      nodes: [
        {
          type: "paragraph",
          runs: [{ kind: "code", text: "D-01, FR-1" }],
        },
      ],
    };
    const [withReferences] = attachInlineReferences(
      [withParagraph],
      buildIndex([withParagraph, project, moduleOne]),
    );
    const paragraph = withReferences?.nodes[0];
    if (paragraph?.type !== "paragraph") throw new Error("expected paragraph");
    const identifiers = paragraph.runs
      .filter((run) => run.kind === "reference")
      .map((run) => run.text);
    expect(identifiers).toEqual(["D-01", "FR-1"]);
  });
});

describe("resolveRelative", () => {
  it("resolves links against the document folder", () => {
    expect(resolveRelative("docs/modules/01/R.md", "../00-core/MODULE.md")).toBe(
      "docs/modules/00-core/MODULE.md",
    );
    expect(resolveRelative("PROJECT_STATE.md", "docs/ARCHITECTURE.md")).toBe(
      "docs/ARCHITECTURE.md",
    );
    expect(resolveRelative("docs/modules/01/R.md", "../../api-contract.md#x")).toBe(
      "docs/api-contract.md",
    );
  });
});
