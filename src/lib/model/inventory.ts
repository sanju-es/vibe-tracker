import type { ModuleInfo } from "./types";

const ROW = /^\|\s*(\d{1,2})\s*\|([^|]*)\|([^|]*)\|/;

/**
 * Reads the module inventory table from `PROJECT_STATE.md` (§6). Returns an empty
 * list when the document does not follow that structure.
 */
export function parseModuleInventory(source: string): ModuleInfo[] {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => /^##\s*6\./.test(line.trim()));
  if (start === -1) return [];

  const modules: ModuleInfo[] = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (/^##\s/.test(line.trim())) break;
    const match = ROW.exec(line.trim());
    if (!match) continue;
    const number = Number.parseInt(match[1] ?? "", 10);
    const name = (match[2] ?? "").replace(/[*`]/g, "").trim();
    const state = (match[3] ?? "").replace(/[*`]/g, "").trim();
    if (!Number.isFinite(number) || name === "") continue;
    modules.push({
      number,
      slug: "",
      name,
      state: state === "" ? null : state,
    });
  }
  return modules;
}
