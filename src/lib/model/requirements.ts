import type { Cell, Document, ItemTarget, Project, RefTarget, Row, Table } from "./types";
import { moduleFolderName } from "./categories";
import { runsText } from "./text";

const SECTION_LABELS: Record<number, string> = {
  2: "Functional requirements",
  3: "Business rules",
  4: "Flows",
  5: "Validations",
  6: "Edge cases",
};

export const REQUIREMENT_SECTIONS: readonly string[] = [2, 3, 4, 5, 6].map(
  (slot) => SECTION_LABELS[slot] ?? "",
);

const HEADERS = ["Module", "State", "Section", "ID", "Text"];

export interface RequirementsCatalog {
  table: Table;
  targets: Map<string, RefTarget>;
}

function cell(column: number, text: string): Cell {
  return { column, text, runs: [{ kind: "text", text }], ref: null };
}

function slotOf(heading: string): number | null {
  const match = /^(\d+)\.?\s/.exec(heading.trim());
  if (!match) return null;
  const slot = Number.parseInt(match[1] ?? "", 10);
  return Number.isFinite(slot) ? slot : null;
}

function leadingId(text: string, prefix: string): string | null {
  const match = new RegExp(`^${prefix}-\\d{1,3}(?=$|[\\s—–:-])`).exec(text.trim());
  return match ? match[0] : null;
}

function bodyAfter(nodes: readonly Document["nodes"][number][], index: number): string {
  const parts: string[] = [];
  for (let cursor = index + 1; cursor < nodes.length; cursor += 1) {
    const node = nodes[cursor];
    if (!node || node.type === "heading") break;
    if (node.type === "paragraph" || node.type === "quote") {
      parts.push(runsText(node.runs).trim());
    } else if (node.type === "list") {
      parts.push(node.items.map((item) => runsText(item).trim()).join(" "));
    } else if (node.type === "code") {
      parts.push(node.text.trim());
    }
  }
  return parts.filter(Boolean).join(" ");
}

/**
 * Builds the cross-module requirements catalogue from the parsed documents.
 * The empty label is supplied by the view so the model does not own UI text.
 */
export function requirementsCatalog(
  project: Project,
  noRequirementsLabel: string,
): RequirementsCatalog {
  const tableId = "requirements-catalog#table-1";
  const rows: Row[] = [];
  const targets = new Map<string, RefTarget>();

  for (const module of project.modules) {
    const document = project.documents.find(
      (entry) =>
        entry.moduleNumber === module.number && entry.category === "requirements",
    );
    if (!document) continue;

    const folder = moduleFolderName(module.number, module.slug, module.name);
    const state = module.state ?? "—";
    let count = 0;

    const addRow = (
      section: string,
      id: string | null,
      text: string,
      sectionTitle: string | null,
      anchor: string | null,
    ): void => {
      const rowId = `${tableId}-r${rows.length + 1}`;
      rows.push({
        id: rowId,
        cells: [
          cell(0, folder),
          cell(1, state),
          cell(2, section),
          cell(3, id ?? "—"),
          cell(4, text),
        ],
      });
      const target: ItemTarget = {
        kind: "item",
        documentId: document.id,
        documentTitle: document.title,
        moduleNumber: module.number,
        sectionTitle,
        anchor,
        text,
      };
      targets.set(rowId, target);
      count += 1;
    };

    let slot: number | null = null;
    let sectionTitle: string | null = null;
    let sectionAnchor: string | null = null;

    for (let index = 0; index < document.nodes.length; index += 1) {
      const node = document.nodes[index];
      if (!node) continue;

      if (node.type === "heading") {
        const headingText = runsText(node.runs).trim();
        if (node.level <= 2) {
          slot = node.level === 2 ? slotOf(headingText) : null;
        }
        sectionTitle = headingText;
        sectionAnchor = node.anchor;

        if (node.level !== 3 || slot !== 2) continue;
        const id = leadingId(headingText, "FR");
        if (!id) continue;
        const body = bodyAfter(document.nodes, index);
        addRow(
          "Functional requirements",
          id,
          [headingText, body].filter(Boolean).join(" "),
          "Functional requirements",
          node.anchor,
        );
        continue;
      }

      if (node.type !== "list" || slot === null || slot === 2) continue;
      const section = SECTION_LABELS[slot];
      if (!section) continue;

      for (const item of node.items) {
        const text = runsText(item).trim();
        if (text === "") continue;
        const id =
          slot === 3 ? leadingId(text, "BR") : slot === 5 ? leadingId(text, "VAL") : null;
        addRow(section, id, text, sectionTitle, sectionAnchor);
      }
    }

    if (count === 0) {
      addRow("—", null, noRequirementsLabel, null, null);
    }
  }

  return {
    table: {
      id: tableId,
      headers: HEADERS,
      rows,
      statusColumn: 1,
    },
    targets,
  };
}
