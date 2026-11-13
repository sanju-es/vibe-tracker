import { describe, expect, it } from "vitest";
import { messages, t } from "../src/lib/i18n";

describe("messages", () => {
  it("has no empty value", () => {
    for (const [key, value] of Object.entries(messages)) {
      expect(value.trim(), key).not.toBe("");
    }
  });

  it("uses a namespaced key for every message", () => {
    for (const key of Object.keys(messages)) {
      expect(key).toMatch(/^[a-z][a-zA-Z0-9-]*(\.[a-z][a-zA-Z0-9-]*)+$/);
    }
  });
});

describe("t", () => {
  it("interpolates values", () => {
    expect(t("scan.progress", { done: 2, total: 5 })).toBe("2 of 5 files");
    expect(t("reference.open", { id: "D-02" })).toBe("Show detail of D-02");
  });

  it("keeps unknown placeholders untouched", () => {
    expect(t("scan.progress", { done: 1 })).toContain("{total}");
  });

  it("returns the key when the message is missing", () => {
    expect(t("does.not.exist" as never)).toBe("does.not.exist");
  });
});
