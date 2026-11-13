import { describe, expect, it } from "vitest";
import {
  detectStatusColumn,
  isStatusHeader,
  mapStatus,
  statusRank,
  vocabularyKeys,
} from "../src/lib/semantics/status";

describe("status vocabulary", () => {
  it("recognises the workflow states", () => {
    expect(mapStatus("Pending").key).toBe("pending");
    expect(mapStatus("in analysis").key).toBe("in-analysis");
    expect(mapStatus("Implementation proposal").key).toBe("implementation-proposal");
    expect(mapStatus("Tested").key).toBe("tested");
    expect(mapStatus("Active (permanent)").key).toBe("active");
  });

  it("recognises the backlog states and their dated forms", () => {
    expect(mapStatus("new").key).toBe("new");
    expect(mapStatus("in progress").key).toBe("in-progress");
    expect(mapStatus("deferred").key).toBe("deferred");
    expect(mapStatus("discarded").key).toBe("discarded");
    expect(mapStatus("implemented (2026-11-13)").key).toBe("implemented");
    expect(mapStatus("moved (02 B-03, 2026-11-13)").key).toBe("moved");
  });

  it("ignores case and extra spaces", () => {
    expect(mapStatus("  BLOCKED  ").key).toBe("blocked");
  });

  it("keeps unknown values neutral with their literal text", () => {
    const status = mapStatus("Waiting for review");
    expect(status.key).toBeNull();
    expect(status.value).toBe("Waiting for review");
  });

  it("orders statuses by vocabulary, unknown last", () => {
    expect(statusRank(mapStatus("Pending"))).toBeLessThan(
      statusRank(mapStatus("Tested")),
    );
    expect(statusRank(mapStatus("Whatever"))).toBe(vocabularyKeys().length);
  });
});

describe("status column detection", () => {
  it("accepts the documented headers only", () => {
    expect(isStatusHeader("Status")).toBe(true);
    expect(isStatusHeader("estado")).toBe(true);
    expect(isStatusHeader("State")).toBe(true);
    expect(isStatusHeader("Result")).toBe(false);
  });

  it("returns the column index or null", () => {
    expect(detectStatusColumn(["#", "Item", "Status", "Note"])).toBe(2);
    expect(detectStatusColumn(["#", "Item", "Result"])).toBeNull();
    expect(detectStatusColumn([])).toBeNull();
  });

  it("never guesses from cell values", () => {
    expect(detectStatusColumn(["#", "Module", "State", "Docs"])).toBe(2);
    expect(detectStatusColumn(["#", "Pending", "Blocked"])).toBeNull();
  });
});
