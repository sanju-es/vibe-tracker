import { describe, expect, it } from "vitest";
import {
  CATEGORY_ORDER,
  categoryForFile,
  fileNameOf,
  moduleFolderName,
  moduleInfoFromPath,
} from "../src/lib/model/categories";

describe("categoryForFile", () => {
  it("maps project documents by file name", () => {
    expect(categoryForFile("PROJECT_STATE.md", "project")).toBe("state");
    expect(categoryForFile("AGENTS.md", "project")).toBe("agents");
    expect(categoryForFile("DECISIONS.md", "project")).toBe("decisions");
    expect(categoryForFile("README.md", "project")).toBe("readme");
  });

  it("maps module documents by file name", () => {
    expect(categoryForFile("MODULE.md", "module")).toBe("module-summary");
    expect(categoryForFile("REQUIREMENTS.md", "module")).toBe("requirements");
    expect(categoryForFile("TECHNICAL.md", "module")).toBe("technical");
    expect(categoryForFile("CHANGELOG.md", "module")).toBe("changelog");
    expect(categoryForFile("BACKLOG.md", "module")).toBe("backlog");
  });

  it("keeps unknown files visible under other", () => {
    expect(categoryForFile("NOTES.md", "module")).toBe("other");
    expect(categoryForFile("PROJECT_STATE.md", "module")).toBe("other");
  });

  it("declares every category exactly once", () => {
    expect(new Set(CATEGORY_ORDER).size).toBe(CATEGORY_ORDER.length);
  });
});

describe("moduleInfoFromPath", () => {
  it("reads number and slug", () => {
    expect(moduleInfoFromPath("docs/modules/01-structured-reader/MODULE.md")).toEqual({
      number: 1,
      slug: "structured-reader",
    });
    expect(moduleInfoFromPath("docs/modules/00-core/TECHNICAL.md")).toEqual({
      number: 0,
      slug: "core",
    });
  });

  it("ignores documents outside a module folder", () => {
    expect(moduleInfoFromPath("docs/ARCHITECTURE.md")).toBeNull();
    expect(moduleInfoFromPath("PROJECT_STATE.md")).toBeNull();
  });
});

describe("fileNameOf", () => {
  it("returns the last segment", () => {
    expect(fileNameOf("docs/modules/02-backlog-board/MODULE.md")).toBe("MODULE.md");
    expect(fileNameOf("README.md")).toBe("README.md");
  });
});

describe("moduleFolderName", () => {
  it("pads the number and uses the slug", () => {
    expect(moduleFolderName(1, "structured-reader")).toBe("01-structured-reader");
    expect(moduleFolderName(0, "core")).toBe("00-core");
  });

  it("derives the folder from the name when there is no slug", () => {
    expect(moduleFolderName(3, "", "Backlog Board")).toBe("03-backlog-board");
    expect(moduleFolderName(4, "", "")).toBe("04-4");
  });
});
