import type { BlockNode, Document, InlineRun, LinkKind } from "../model/types";
import { resolveRelative } from "../semantics/references";

function resolveRun(
  run: InlineRun,
  documentPath: string,
  known: ReadonlySet<string>,
): InlineRun {
  const next: InlineRun = { ...run };
  if (run.children) {
    next.children = run.children.map((child) => resolveRun(child, documentPath, known));
  }
  if (run.kind === "link" && run.linkKind === "document" && run.targetPath) {
    const resolved = resolveRelative(documentPath, run.targetPath);
    next.targetPath = resolved;
    next.linkKind = known.has(resolved) ? "document" : "broken";
  }
  if ((run.kind === "link" || run.kind === "image") && run.targetPath) {
    next.targetPath = resolveRelative(documentPath, run.targetPath);
  }
  return next;
}

function resolveNode(
  node: BlockNode,
  documentPath: string,
  known: ReadonlySet<string>,
): BlockNode {
  switch (node.type) {
    case "heading":
      return {
        ...node,
        runs: node.runs.map((run) => resolveRun(run, documentPath, known)),
      };
    case "paragraph":
      return {
        ...node,
        runs: node.runs.map((run) => resolveRun(run, documentPath, known)),
      };
    case "quote":
      return {
        ...node,
        runs: node.runs.map((run) => resolveRun(run, documentPath, known)),
      };
    case "list":
      return {
        ...node,
        items: node.items.map((item) =>
          item.map((run) => resolveRun(run, documentPath, known)),
        ),
      };
    case "image":
      return { ...node, path: resolveRelative(documentPath, node.path) };
    default:
      return node;
  }
}

export interface LinkResolution {
  documents: Document[];
  brokenLinks: number;
}

/**
 * Resolves relative link and image targets against each document, and marks as
 * broken any link whose target is not part of the project.
 */
export function resolveLinks(
  documents: readonly Document[],
  imagePaths: ReadonlySet<string>,
): LinkResolution {
  const known = new Set<string>(documents.map((document) => document.id));
  for (const path of imagePaths) known.add(path);

  let brokenLinks = 0;
  const resolved = documents.map((document) => ({
    ...document,
    meta: {
      ...document.meta,
      fields: document.meta.fields.map((field) => ({
        ...field,
        runs: field.runs.map((run) => resolveRun(run, document.path, known)),
      })),
    },
    nodes: document.nodes.map((node) => {
      const next = resolveNode(node, document.path, known);
      if (next.type === "heading" || next.type === "paragraph" || next.type === "quote") {
        for (const run of next.runs) {
          if (run.linkKind === "broken") brokenLinks += 1;
        }
      }
      return next;
    }),
  }));

  return { documents: resolved, brokenLinks };
}

export function isBroken(kind: LinkKind | undefined): boolean {
  return kind === "broken";
}
