import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { BlockNode, Document, InlineRun, Table } from "../src/lib/model/types";
import { parseDocument } from "../src/lib/markdown/pipeline";
import {
  attachInlineReferences,
  attachReferences,
  buildIndex,
  duplicateIdentifiers,
  isIdentifier,
  parseIdentifier,
  resolveRelative,
  resolveTargets,
} from "../src/lib/semantics/references";

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

const h2 = (text: string, anchor: string): BlockNode => ({
  type: "heading",
  level: 2,
  anchor,
  runs: [{ kind: "text", text }],
});

const h3 = (text: string, anchor: string): BlockNode => ({
  type: "heading",
  level: 3,
  anchor,
  runs: [{ kind: "text", text }],
});

const list = (...items: string[]): BlockNode => ({
  type: "list",
  ordered: false,
  items: items.map((text) => [{ kind: "text", text }]),
});

const paragraph = (text: string): BlockNode => ({
  type: "paragraph",
  runs: [{ kind: "text", text }],
});

const tableNode = (tableId: string): BlockNode => ({ type: "table", tableId });

const DECISIONS = "docs/DECISIONS.md";
const REQUIREMENTS = "docs/modules/01-structured-reader/REQUIREMENTS.md";
const TECHNICAL = "docs/modules/01-structured-reader/TECHNICAL.md";
const BACKLOG = "docs/modules/01-structured-reader/BACKLOG.md";
const CORE_BACKLOG = "docs/modules/00-core/BACKLOG.md";
const CORE_MODULE = "docs/modules/00-core/MODULE.md";

const decisions = document(
  DECISIONS,
  "DECISIONS.md",
  null,
  [
    h2("1. Approved decisions", "approved-decisions"),
    tableNode(`${DECISIONS}#decisions`),
  ],
  [
    makeTable(
      `${DECISIONS}#decisions`,
      ["#", "Date", "Decision"],
      [
        ["D-04", "2026-11-13", "Read-only access"],
        ["D-05", "2026-11-13", "Working method"],
      ],
    ),
  ],
);

const requirements = document(
  REQUIREMENTS,
  "REQUIREMENTS.md",
  1,
  [
    h2("2. Functional requirements", "functional-requirements"),
    h3("FR-1 — First rule", "fr-1--first-rule"),
    paragraph("The rule."),
    h2("3. Business rules", "business-rules"),
    list("BR-1 — Always."),
    h2("5. Validations", "validations"),
    list("VAL-1 — Never."),
    h2("9. Acceptance criteria", "acceptance-criteria"),
    tableNode(`${REQUIREMENTS}#acceptance`),
  ],
  [
    makeTable(
      `${REQUIREMENTS}#acceptance`,
      ["FR", "Criterion", "Evidence", "Status"],
      [
        ["FR-1", "Works", "tests/first.test.ts", "pending (owner)"],
        ["D-04", "Decision", "tests/second.test.ts", "pending (owner)"],
      ],
    ),
  ],
);

const technical = document(
  TECHNICAL,
  "TECHNICAL.md",
  1,
  [
    h2("8. Implementation status", "implementation-status"),
    tableNode(`${TECHNICAL}#milestones`),
  ],
  [
    makeTable(
      `${TECHNICAL}#milestones`,
      ["#", "Milestone", "State"],
      [["MS-01", "First milestone", "Implemented"]],
    ),
  ],
);

const backlog = document(
  BACKLOG,
  "BACKLOG.md",
  1,
  [h2("1. Entries", "entries"), tableNode(`${BACKLOG}#entries`)],
  [
    makeTable(
      `${BACKLOG}#entries`,
      ["ID", "Date", "Type", "Description", "Origin", "Priority", "Status"],
      [["B-01", "2026-11-13", "improvement", "Sorting", "Owner", "low", "new"]],
    ),
  ],
);

const changelog = document(
  "docs/modules/01-structured-reader/CHANGELOG.md",
  "CHANGELOG.md",
  1,
  [
    h2("2026-11-13 — Initial", "2026-11-13--initial"),
    list("CORE-01 — shipped"),
    paragraph("See FR-1 and 01 B-01."),
  ],
);

const coreBacklog = document(
  CORE_BACKLOG,
  "BACKLOG.md",
  0,
  [h2("1. Entries", "entries"), tableNode(`${CORE_BACKLOG}#entries`)],
  [
    makeTable(
      `${CORE_BACKLOG}#entries`,
      ["ID", "Date", "Type", "Description", "Origin", "Priority", "Status"],
      [
        [
          "CORE-01",
          "2026-11-13",
          "improvement",
          "Skeleton",
          "D-14",
          "high",
          "implemented (2026-11-13)",
        ],
      ],
    ),
  ],
);

const coreModule = document(
  CORE_MODULE,
  "MODULE.md",
  0,
  [h2("4. Invariants (CR-NN)", "invariants"), tableNode(`${CORE_MODULE}#invariants`)],
  [
    makeTable(
      `${CORE_MODULE}#invariants`,
      ["ID", "Invariant", "Source of truth"],
      [["CR-01", "Typed data", "TECHNICAL.md §4"]],
    ),
  ],
);

const baseDocuments = [
  decisions,
  requirements,
  technical,
  backlog,
  changelog,
  coreBacklog,
  coreModule,
];

const baseIndex = buildIndex(baseDocuments);

describe("identifier rules", () => {
  it("accepts the namespaces of the standard", () => {
    for (const value of [
      "D-04",
      "CORE-08",
      "CR-01",
      "FR-3",
      "BR-1",
      "VAL-11",
      "MS-01",
      "B-01",
    ]) {
      expect(isIdentifier(value)).toBe(true);
    }
  });

  it("rejects rule ids, retired prefixes, reserved namespaces and malformed forms", () => {
    for (const value of [
      "G-01",
      "T-02",
      "V-2",
      "R-07",
      "F-05",
      "L-04",
      "AG-03",
      "E-04",
      "P-1",
      "DEF-01",
      "IMP-02",
      "A-1",
      "N-1",
      "I-1",
      "Q-1",
      "M-1",
      "SEC-01",
      "DOC-01",
      "REL-01",
      "RISK-01",
      "NFR-01",
      "D-4",
      "CORE-8",
      "CR-1",
      "MS-1",
      "B-1",
      "FR-1234",
      "see D-04",
      "d-04",
      "FR-3a",
      "",
    ]) {
      expect(isIdentifier(value)).toBe(false);
    }
  });

  it("reports the namespace and scope of a valid identifier", () => {
    expect(parseIdentifier("D-04")).toMatchObject({ prefix: "D", scope: "global" });
    expect(parseIdentifier("CORE-08")).toMatchObject({
      prefix: "CORE",
      scope: "global",
    });
    expect(parseIdentifier("CR-01")).toMatchObject({ prefix: "CR", scope: "global" });
    expect(parseIdentifier("FR-3")).toMatchObject({ prefix: "FR", scope: "module" });
  });
});

describe("reference index", () => {
  it("indexes only the owning file and slot", () => {
    expect([...baseIndex.keys()].sort()).toEqual([
      "B-01",
      "BR-1",
      "CORE-01",
      "CR-01",
      "D-04",
      "D-05",
      "FR-1",
      "MS-01",
      "VAL-1",
    ]);
  });

  it("does not index an acceptance row or a decision index as a definition", () => {
    expect(baseIndex.get("FR-1")).toHaveLength(1);
    expect(baseIndex.get("FR-1")?.[0]?.kind).toBe("item");
    expect(baseIndex.get("D-04")).toHaveLength(1);
    expect(baseIndex.get("D-04")?.[0]?.documentId).toBe(DECISIONS);
  });

  it("does not index rule ids or reserved namespaces", () => {
    const standard = document(
      "docs/DOC-STANDARD.md",
      "DOC-STANDARD.md",
      null,
      [h2("10. Enforcement", "enforcement"), list("E-04 — anchors resolve")],
      [
        makeTable(
          "docs/DOC-STANDARD.md#checks",
          ["#", "Check"],
          [["E-04", "anchors resolve"]],
        ),
      ],
    );
    const index = buildIndex([standard]);
    expect([...index.keys()]).toEqual([]);
  });

  it("takes CORE from the backlog, not from a changelog bullet", () => {
    const target = baseIndex.get("CORE-01")?.[0];
    expect(target).toMatchObject({ kind: "row", documentId: CORE_BACKLOG });
  });

  it("reports duplicates only when an owner defines an id twice", () => {
    const duplicate = document(
      CORE_BACKLOG,
      "BACKLOG.md",
      0,
      [h2("1. Entries", "entries"), tableNode(`${CORE_BACKLOG}#entries`)],
      [
        makeTable(
          `${CORE_BACKLOG}#entries`,
          ["ID", "Date", "Type", "Description", "Origin", "Priority", "Status"],
          [
            [
              "CORE-01",
              "2026-11-13",
              "improvement",
              "Skeleton",
              "D-14",
              "high",
              "implemented (2026-11-13)",
            ],
            ["CORE-01", "2026-11-13", "improvement", "Repeated", "Audit", "low", "new"],
          ],
        ),
      ],
    );
    expect(duplicateIdentifiers(buildIndex([duplicate]))).toEqual(["CORE-01"]);
  });

  it("does not treat the same module id in two modules as a duplicate", () => {
    const moduleTwoBacklog = document(
      "docs/modules/02-backlog-board/BACKLOG.md",
      "BACKLOG.md",
      2,
      [h2("1. Entries", "entries"), tableNode("m2#entries")],
      [
        makeTable(
          "m2#entries",
          ["ID", "Date", "Type", "Description", "Origin", "Priority", "Status"],
          [["B-01", "2026-11-13", "improvement", "Other", "Owner", "low", "new"]],
        ),
      ],
    );
    const index = buildIndex([backlog, moduleTwoBacklog]);
    expect(duplicateIdentifiers(index)).toEqual([]);
    expect(resolveTargets("B-01", 1, index)[0]?.documentId).toBe(BACKLOG);
    expect(resolveTargets("B-01", 2, index)[0]?.documentId).toBe(moduleTwoBacklog.id);
  });

  it("qualifies a duplicate that repeats inside one module", () => {
    const duplicate = document(
      BACKLOG,
      "BACKLOG.md",
      1,
      [h2("1. Entries", "entries"), tableNode(`${BACKLOG}#entries`)],
      [
        makeTable(
          `${BACKLOG}#entries`,
          ["ID", "Date", "Type", "Description", "Origin", "Priority", "Status"],
          [
            ["B-01", "2026-11-13", "improvement", "Sorting", "Owner", "low", "new"],
            ["B-01", "2026-11-13", "improvement", "Repeated", "Audit", "low", "new"],
          ],
        ),
      ],
    );
    expect(duplicateIdentifiers(buildIndex([duplicate]))).toEqual(["01 B-01"]);
  });
});

describe("table cell references", () => {
  it("links an acceptance row to the requirement heading", () => {
    const [withReferences] = attachReferences([requirements], baseIndex);
    const target = withReferences?.tables[0]?.rows[0]?.cells[0];
    expect(target?.ref?.identifier).toBe("FR-1");
    expect(target?.ref?.targets[0]).toMatchObject({
      kind: "item",
      anchor: "fr-1--first-rule",
    });
  });

  it("links a decision index cell to the decisions table", () => {
    const moduleDocument = document(
      "docs/modules/01-structured-reader/MODULE.md",
      "MODULE.md",
      1,
      [h2("7. Decisions", "decisions"), tableNode("module#decisions")],
      [
        makeTable(
          "module#decisions",
          ["Decision", "Gloss"],
          [["D-04", "Read-only access"]],
        ),
      ],
    );
    const [withReferences] = attachReferences([moduleDocument], baseIndex);
    const target = withReferences?.tables[0]?.rows[0]?.cells[0];
    expect(target?.ref?.identifier).toBe("D-04");
    expect(target?.ref?.targets[0]?.documentId).toBe(DECISIONS);
  });

  it("does not link the cell that defines the row", () => {
    const [withReferences] = attachReferences([decisions], baseIndex);
    expect(withReferences?.tables[0]?.rows[0]?.cells[0]?.ref).toBeNull();
  });

  it("leaves prose that contains an identifier alone", () => {
    const prose = document(
      "docs/modules/01-structured-reader/MODULE.md",
      "MODULE.md",
      1,
      [paragraph("See D-04 for details")],
      [makeTable("module#prose", ["Text"], [["See D-04 for details"]])],
    );
    const [withReferences] = attachReferences([prose], baseIndex);
    expect(withReferences?.tables[0]?.rows[0]?.cells[0]?.ref).toBeNull();
  });

  it("links a qualified cell to another module", () => {
    const moduleTwoBacklog = document(
      "docs/modules/02-backlog-board/BACKLOG.md",
      "BACKLOG.md",
      2,
      [h2("1. Entries", "entries"), tableNode("m2#entries")],
      [
        makeTable(
          "m2#entries",
          ["ID", "Date", "Type", "Description", "Origin", "Priority", "Status"],
          [["B-01", "2026-11-13", "improvement", "Other", "Owner", "low", "new"]],
        ),
      ],
    );
    const state = document(
      "PROJECT_STATE.md",
      "PROJECT_STATE.md",
      null,
      [
        h2("6. Module inventory and state", "module-inventory"),
        tableNode("state#inventory"),
      ],
      [
        makeTable(
          "state#inventory",
          ["#", "Module", "Open items"],
          [["2", "Backlog Board", "02 B-01"]],
        ),
      ],
    );
    const [withReferences] = attachReferences(
      [state, moduleTwoBacklog],
      buildIndex([state, moduleTwoBacklog]),
    );
    const target = withReferences?.tables[0]?.rows[0]?.cells[2];
    expect(target?.ref?.identifier).toBe("B-01");
    expect(target?.ref?.targets[0]?.moduleNumber).toBe(2);
  });
});

describe("resolution scope", () => {
  const moduleTwoRequirements = document(
    "docs/modules/02-backlog-board/REQUIREMENTS.md",
    "REQUIREMENTS.md",
    2,
    [
      h2("2. Functional requirements", "functional-requirements"),
      h3("FR-1 — Other rule", "fr-1--other-rule"),
    ],
  );
  const scopedIndex = buildIndex([...baseDocuments, moduleTwoRequirements]);

  it("resolves a bare module id inside its own module", () => {
    const targets = resolveTargets("FR-1", 1, scopedIndex);
    expect(targets).toHaveLength(1);
    expect(targets[0]?.documentId).toBe(REQUIREMENTS);
  });

  it("resolves the same bare id to the module that owns the document", () => {
    const targets = resolveTargets("FR-1", 2, scopedIndex);
    expect(targets).toHaveLength(1);
    expect(targets[0]?.documentId).toBe(moduleTwoRequirements.id);
  });

  it("does not resolve a bare module id from a project document", () => {
    expect(resolveTargets("FR-1", null, scopedIndex)).toEqual([]);
  });

  it("requires the qualifier outside the owning module", () => {
    const targets = resolveTargets("FR-1", null, scopedIndex, 1);
    expect(targets).toHaveLength(1);
    expect(targets[0]?.documentId).toBe(REQUIREMENTS);
  });

  it("resolves global namespaces from any scope and ignores the qualifier", () => {
    expect(resolveTargets("D-04", 2, scopedIndex)).toHaveLength(1);
    expect(resolveTargets("D-04", null, scopedIndex, 1)).toHaveLength(1);
  });

  it("does not borrow another module's definition", () => {
    expect(resolveTargets("B-01", 2, scopedIndex)).toEqual([]);
    expect(resolveTargets("B-01", null, scopedIndex)).toEqual([]);
  });
});

describe("inline references", () => {
  it("does not link the identifier that defines a heading", () => {
    const [withReferences] = attachInlineReferences([requirements], baseIndex);
    const heading = withReferences?.nodes[1];
    if (heading?.type !== "heading") throw new Error("expected heading");
    expect(heading.runs.some((run) => run.kind === "reference")).toBe(false);
  });

  it("does not link the identifier that defines a list item", () => {
    const [withReferences] = attachInlineReferences([requirements], baseIndex);
    const business = withReferences?.nodes[4];
    if (business?.type !== "list") throw new Error("expected list");
    expect((business.items[0] ?? []).some((run) => run.kind === "reference")).toBe(false);
  });

  it("links a mention inside the module and leaves rule ids plain", () => {
    const notes = document(TECHNICAL, "TECHNICAL.md", 1, [
      paragraph("See FR-1 and E-04 and AG-03."),
    ]);
    const [withReferences] = attachInlineReferences([notes], baseIndex);
    const node = withReferences?.nodes[0];
    if (node?.type !== "paragraph") throw new Error("expected paragraph");
    const references = node.runs
      .filter((run) => run.kind === "reference")
      .map((run) => run.text);
    expect(references).toEqual(["FR-1"]);
  });

  it("does not link a bare module id from a project document", () => {
    const projectDocument = document("PROJECT_STATE.md", "PROJECT_STATE.md", null, [
      paragraph("Bare FR-1 stays plain, but 01 FR-1 and D-04 resolve."),
    ]);
    const [withReferences] = attachInlineReferences([projectDocument], baseIndex);
    const node = withReferences?.nodes[0];
    if (node?.type !== "paragraph") throw new Error("expected paragraph");
    expect(
      node.runs.filter((run) => run.kind === "reference").map((run) => run.text),
    ).toEqual(["01 FR-1", "D-04"]);
  });

  it("links every identifier inside one table cell", () => {
    const source = document(
      REQUIREMENTS,
      "REQUIREMENTS.md",
      1,
      [h2("9. Acceptance criteria", "acceptance"), tableNode("notes#table")],
      [makeTable("notes#table", ["ID", "Origin"], [["FR-1", "D-04 and FR-1"]])],
    );
    const [withReferences] = attachInlineReferences([source], baseIndex);
    const runs = withReferences?.tables[0]?.rows[0]?.cells[1]?.runs ?? [];
    expect(runs.filter((run) => run.kind === "reference").map((run) => run.text)).toEqual(
      ["D-04", "FR-1"],
    );
  });

  it("links several identifiers inside one code span", () => {
    const source = document(TECHNICAL, "TECHNICAL.md", 1, [
      { type: "paragraph", runs: [{ kind: "code", text: "D-04, FR-1" }] },
    ]);
    const [withReferences] = attachInlineReferences([source], baseIndex);
    const node = withReferences?.nodes[0];
    if (node?.type !== "paragraph") throw new Error("expected paragraph");
    expect(
      node.runs.filter((run) => run.kind === "reference").map((run) => run.text),
    ).toEqual(["D-04", "FR-1"]);
  });

  it("links a qualified backlog item inside another module", () => {
    const moduleSix = document(
      "docs/modules/06-distribution/BACKLOG.md",
      "BACKLOG.md",
      6,
      [h2("1. Entries", "entries"), tableNode("m6#entries")],
      [
        makeTable(
          "m6#entries",
          ["ID", "Date", "Type", "Description", "Origin", "Priority", "Status"],
          [["B-01", "2026-11-13", "improvement", "Packaging", "Owner", "low", "new"]],
        ),
      ],
    );
    const projectDocument = document("PROJECT_STATE.md", "PROJECT_STATE.md", null, [
      paragraph("See 06 B-01 for the pending work."),
    ]);
    const [withReferences] = attachInlineReferences(
      [projectDocument, moduleSix],
      buildIndex([projectDocument, moduleSix]),
    );
    const node = withReferences?.nodes[0];
    if (node?.type !== "paragraph") throw new Error("expected paragraph");
    const reference = node.runs.find((run) => run.kind === "reference");
    expect(reference?.text).toBe("06 B-01");
    expect(reference?.ref?.targets[0]?.moduleNumber).toBe(6);
  });

  it("leaves qualified globals and malformed identifiers as text", () => {
    const source = document(TECHNICAL, "TECHNICAL.md", 1, [
      paragraph("01 D-04, D-4, B-1 and E-04 stay plain."),
    ]);
    const [withReferences] = attachInlineReferences([source], baseIndex);
    const node = withReferences?.nodes[0];
    if (node?.type !== "paragraph") throw new Error("expected paragraph");
    expect(node.runs.filter((run) => run.kind === "reference")).toEqual([]);
  });

  it("links a CORE mention in a changelog to its backlog row", () => {
    const [withReferences] = attachInlineReferences([changelog], baseIndex);
    const list = withReferences?.nodes[1];
    if (list?.type !== "list") throw new Error("expected list");
    const reference = (list.items[0] ?? []).find(
      (run): run is InlineRun & { kind: "reference" } => run.kind === "reference",
    );
    expect(reference?.ref?.targets[0]).toMatchObject({
      kind: "row",
      documentId: CORE_BACKLOG,
    });
  });
});

describe("real documents", () => {
  it("resolves the requirements of module 1 from the real document", () => {
    const path = "docs/modules/01-structured-reader/REQUIREMENTS.md";
    const parsed = parseDocument(path, readFileSync(path, "utf8"));
    const real = document(path, "REQUIREMENTS.md", 1, parsed.blocks, parsed.tables);
    const index = buildIndex([real]);
    expect(index.get("FR-6")).toHaveLength(1);
    const target = resolveTargets("FR-6", 1, index)[0];
    const heading = parsed.sections.find((section) => section.text.startsWith("FR-6 "));
    expect(target).toMatchObject({
      kind: "item",
      text: "FR-6 — Interactive tables",
    });
    const anchor = target && target.kind === "item" ? target.anchor : undefined;
    expect(anchor).toBe(heading?.anchor);
  });

  it("indexes the core invariants from the real module 0 document", () => {
    const path = "docs/modules/00-core/MODULE.md";
    const parsed = parseDocument(path, readFileSync(path, "utf8"));
    const real = document(path, "MODULE.md", 0, parsed.blocks, parsed.tables);
    const index = buildIndex([real]);
    expect(index.get("CR-01")).toHaveLength(1);
    expect(resolveTargets("CR-01", 0, index)[0]).toMatchObject({
      kind: "row",
      documentId: path,
    });
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
