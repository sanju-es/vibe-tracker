import type { InlineRun } from "./types";

/** Plain text of a run list, used for labels, titles and the reference index. */
export function runsText(runs: readonly InlineRun[] | undefined): string {
  if (!runs) return "";
  return runs
    .map((run) => {
      if (run.children && run.children.length > 0) return runsText(run.children);
      return run.text;
    })
    .join("");
}
