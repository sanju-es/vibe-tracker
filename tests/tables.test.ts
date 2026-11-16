import { describe, expect, it } from "vitest";
import type { Cell, Row, Table } from "../src/lib/model/types";
import {
  applyView,
  filterRows,
  groupRows,
  statusesExcluding,
  statusOptions,
  toggleSort,
  EMPTY_TABLE_VIEW,
} from "../src/lib/semantics/tables";

function cell(column: number, text: string): Cell {
  return { column, text, runs: [{ kind: "text", text }], ref: null };
}

function row(id: string, values: string[]): Row {
  return { id, cells: values.map((value, index) => cell(index, value)) };
}

const table: Table = {
  id: "doc#table-1",
  headers: ["#", "Item", "Status", "Note"],
  statusColumn: 2,
  rows: [
    row("r1", ["1", "Alpha", "Pending", "first"]),
    row("r2", ["2", "Beta", "Tested", "second"]),
    row("r3", ["3", "Gamma", "Pending", "third"]),
    row("4", ["10", "Delta", "Unknown state", ""]),
  ],
};

describe("table filtering", () => {
  it("matches text in any cell, ignoring accents and case", () => {
    expect(
      filterRows(table, table.rows, { ...EMPTY_TABLE_VIEW, text: "beta" }),
    ).toHaveLength(1);
    const accented: Table = {
      ...table,
      rows: [row("a1", ["1", "Análisis", "Pending", "x"])],
    };
    expect(
      filterRows(accented, accented.rows, { ...EMPTY_TABLE_VIEW, text: "analisis" }),
    ).toHaveLength(1);
  });

  it("filters by status key", () => {
    const rows = filterRows(table, table.rows, {
      ...EMPTY_TABLE_VIEW,
      statuses: ["pending"],
    });
    expect(rows.map((entry) => entry.id)).toEqual(["r1", "r3"]);
  });

  it("supports filtering neutral values", () => {
    const rows = filterRows(table, table.rows, { ...EMPTY_TABLE_VIEW, statuses: [null] });
    expect(rows.map((entry) => entry.id)).toEqual(["4"]);
  });

  it("shows nothing when no status is selected", () => {
    expect(
      filterRows(table, table.rows, { ...EMPTY_TABLE_VIEW, statuses: [] }),
    ).toHaveLength(0);
  });
});

describe("table sorting", () => {
  it("sorts numerically when the column looks numeric", () => {
    const rows = applyView(table, {
      ...EMPTY_TABLE_VIEW,
      sort: { column: 0, direction: "asc" },
    });
    expect(rows.map((entry) => entry.cells[0]?.text)).toEqual(["1", "2", "3", "10"]);
  });

  it("sorts statuses by vocabulary order", () => {
    const rows = applyView(table, {
      ...EMPTY_TABLE_VIEW,
      sort: { column: 2, direction: "asc" },
    });
    expect(rows.map((entry) => entry.cells[2]?.text)).toEqual([
      "Pending",
      "Pending",
      "Tested",
      "Unknown state",
    ]);
  });

  it("keeps empty cells last in both directions", () => {
    const rows = applyView(table, {
      ...EMPTY_TABLE_VIEW,
      sort: { column: 3, direction: "desc" },
    });
    expect(rows[rows.length - 1]?.id).toBe("4");
  });

  it("toggles the direction of the same column", () => {
    const first = toggleSort(EMPTY_TABLE_VIEW, 1);
    expect(first.sort).toEqual({ column: 1, direction: "asc" });
    expect(toggleSort(first, 1).sort).toEqual({ column: 1, direction: "desc" });
    expect(toggleSort(first, 2).sort).toEqual({ column: 2, direction: "asc" });
  });
});

describe("table grouping", () => {
  const board: Table = {
    id: "board#table-1",
    headers: ["Module", "ID", "Status"],
    statusColumn: 2,
    rows: [
      row("b1", ["01-reader", "B-02", "blocked"]),
      row("b2", ["02-board", "B-01", "discarded"]),
      row("b3", ["01-reader", "B-01", "new"]),
      row("b4", ["02-board", "B-02", "new"]),
    ],
  };

  it("groups by module and keeps the group order", () => {
    const groups = groupRows(board, EMPTY_TABLE_VIEW, 0);
    expect(groups.map((group) => group.key)).toEqual(["01-reader", "02-board"]);
    expect(groups[0]?.rows.map((entry) => entry.id)).toEqual(["b1", "b3"]);
    expect(groups[1]?.rows.map((entry) => entry.id)).toEqual(["b2", "b4"]);
  });

  it("orders status groups by the vocabulary", () => {
    const groups = groupRows(board, EMPTY_TABLE_VIEW, 2);
    expect(groups.map((group) => group.key)).toEqual(["blocked", "new", "discarded"]);
  });

  it("follows an explicit group order and keeps unknown keys last", () => {
    const groups = groupRows(board, EMPTY_TABLE_VIEW, 0, ["02-board", "01-reader"]);
    expect(groups.map((group) => group.key)).toEqual(["02-board", "01-reader"]);
    const partial = groupRows(board, EMPTY_TABLE_VIEW, 0, ["02-board"]);
    expect(partial.map((group) => group.key)).toEqual(["02-board", "01-reader"]);
  });

  it("groups dated status literals under their status key", () => {
    const dated: Table = {
      ...board,
      rows: [
        row("d1", ["01-reader", "B-01", "implemented (2026-11-12)"]),
        row("d2", ["01-reader", "B-02", "implemented (2026-11-13)"]),
      ],
    };
    const groups = groupRows(dated, EMPTY_TABLE_VIEW, 2);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.key).toBe("implemented");
    expect(groups[0]?.rows).toHaveLength(2);
  });

  it("filters before grouping", () => {
    const groups = groupRows(board, { ...EMPTY_TABLE_VIEW, text: "new" }, 0);
    expect(groups.map((group) => group.key)).toEqual(["01-reader", "02-board"]);
    expect(groups[0]?.rows.map((entry) => entry.id)).toEqual(["b3"]);
    expect(groups[1]?.rows.map((entry) => entry.id)).toEqual(["b4"]);
  });

  it("sorts inside each group", () => {
    const groups = groupRows(
      board,
      { ...EMPTY_TABLE_VIEW, sort: { column: 1, direction: "asc" } },
      0,
    );
    expect(groups[0]?.rows.map((entry) => entry.id)).toEqual(["b3", "b1"]);
    expect(groups[1]?.rows.map((entry) => entry.id)).toEqual(["b2", "b4"]);
  });

  it("returns no groups when the filters exclude every row", () => {
    expect(groupRows(board, { ...EMPTY_TABLE_VIEW, text: "missing" }, 0)).toEqual([]);
  });

  it("does not mutate the source rows", () => {
    groupRows(board, { ...EMPTY_TABLE_VIEW, sort: { column: 1, direction: "desc" } }, 0);
    expect(board.rows.map((entry) => entry.id)).toEqual(["b1", "b2", "b3", "b4"]);
  });
});

describe("status options", () => {
  it("counts values and keeps their literal text", () => {
    const options = statusOptions(table);
    expect(options).toEqual(
      expect.arrayContaining([
        { key: "pending", label: "Pending", count: 2 },
        { key: "tested", label: "Tested", count: 1 },
        { key: null, label: "Unknown state", count: 1 },
      ]),
    );
  });

  it("returns nothing when the table has no status column", () => {
    expect(statusOptions({ ...table, statusColumn: null })).toEqual([]);
  });

  it("excludes the requested statuses from the initial view", () => {
    const tested: Table = {
      ...table,
      rows: [...table.rows, row("r4", ["4", "Epsilon", "Implemented", "fourth"])],
    };
    const visible = statusesExcluding(tested, ["implemented"]);
    expect(visible).toEqual(["pending", "tested", null]);
    expect(statusesExcluding(table, ["pending", "tested", null])).toEqual([null]);
    expect(
      filterRows(tested, tested.rows, {
        ...EMPTY_TABLE_VIEW,
        statuses: visible,
      }).map((entry) => entry.id),
    ).toEqual(["r1", "r2", "r3", "4"]);
  });
});
