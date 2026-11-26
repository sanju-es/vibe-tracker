import type {
  Document,
  ImageAsset,
  InlineRun,
  ModuleInfo,
  Project,
  RefTarget,
} from "../model/types";
import {
  categoryForFile,
  fallbackTitle,
  fileNameOf,
  moduleInfoFromPath,
} from "../model/categories";
import { isProjectImage } from "../fs/scope";
import { parseModuleInventory } from "../model/inventory";
import { parseDocument } from "../markdown/pipeline";
import { resolveLinks } from "../markdown/links";
import {
  attachInlineReferences,
  attachReferences,
  buildIndex,
  duplicateIdentifiers,
  resolveRelative,
} from "../semantics/references";

export interface SourceFile {
  path: string;
  text: string;
}

export interface BuildProjectInput {
  name: string;
  files: readonly SourceFile[];
}

function runImages(runs: readonly InlineRun[], documentPath: string): ImageAsset[] {
  const images: ImageAsset[] = [];
  const visit = (run: InlineRun) => {
    if (run.kind === "image" && run.href) {
      images.push({
        path: resolveRelative(documentPath, run.href.split("#")[0] ?? run.href),
        alt: run.text,
        documentId: documentPath,
      });
    }
    if (run.children) run.children.forEach(visit);
  };
  for (const run of runs) visit(run);
  return images;
}

function documentImages(document: Document): ImageAsset[] {
  const images: ImageAsset[] = [];
  for (const field of document.meta.fields) {
    images.push(...runImages(field.runs, document.path));
  }
  for (const node of document.nodes) {
    switch (node.type) {
      case "heading":
      case "paragraph":
      case "quote":
        images.push(...runImages(node.runs, document.path));
        break;
      case "list":
        for (const item of node.items) images.push(...runImages(item, document.path));
        break;
      case "image":
        images.push({ path: node.path, alt: node.alt, documentId: document.path });
        break;
      default:
        break;
    }
  }
  return images.filter((image) => isProjectImage(image.path));
}

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Modules discovered from the documented paths under `docs/modules/NN-slug/`. */
export function moduleInfosFromPaths(paths: readonly string[]): ModuleInfo[] {
  const discovered = new Map<number, ModuleInfo>();
  for (const path of paths) {
    const info = moduleInfoFromPath(path);
    if (!info || discovered.has(info.number)) continue;
    discovered.set(info.number, {
      number: info.number,
      slug: info.slug,
      name: humanizeSlug(info.slug),
      state: null,
    });
  }
  return [...discovered.values()].sort((left, right) => left.number - right.number);
}

/**
 * Merges the module inventory with the folders discovered on disk: an inventory
 * row without a local folder is ignored, and a folder missing from the inventory
 * keeps its folder-derived name. The workspace summary and the project build share
 * this rule.
 */
export function mergeModules(
  discovered: readonly ModuleInfo[],
  inventoryText: string,
): ModuleInfo[] {
  const inventory = parseModuleInventory(inventoryText);
  const byNumber = new Map(discovered.map((module) => [module.number, module]));
  const merged = new Map<number, ModuleInfo>();
  for (const module of inventory) {
    const found = byNumber.get(module.number);
    if (!found) continue;
    merged.set(module.number, {
      ...module,
      slug: found.slug,
    });
  }
  for (const [number, module] of byNumber) {
    if (!merged.has(number)) merged.set(number, module);
  }
  return [...merged.values()].sort((left, right) => left.number - right.number);
}

export function buildProject(input: BuildProjectInput): Project {
  const parsedDocuments: Document[] = [];
  for (const file of input.files) {
    const moduleInfo = moduleInfoFromPath(file.path);
    const parsed = parseDocument(file.path, file.text);
    const title = parsed.sections[0]?.text ?? fallbackTitle(file.path);
    parsedDocuments.push({
      id: file.path,
      path: file.path,
      fileName: fileNameOf(file.path),
      title,
      scope: moduleInfo ? "module" : "project",
      moduleNumber: moduleInfo?.number ?? null,
      moduleSlug: moduleInfo?.slug ?? null,
      category: categoryForFile(fileNameOf(file.path), moduleInfo ? "module" : "project"),
      nodes: parsed.blocks,
      sections: parsed.sections,
      tables: parsed.tables,
      meta: parsed.meta,
    });
  }

  parsedDocuments.sort((a, b) => a.path.localeCompare(b.path));

  const images = parsedDocuments.flatMap(documentImages);
  const imagePaths = new Set(images.map((image) => image.path));
  const resolution = resolveLinks(parsedDocuments, imagePaths);

  const index = buildIndex(resolution.documents);
  const withReferences = attachReferences(resolution.documents, index);
  const withInlineReferences = attachInlineReferences(withReferences, index);

  const inventoryText =
    input.files.find(
      (file) =>
        !moduleInfoFromPath(file.path) && fileNameOf(file.path) === "PROJECT_STATE.md",
    )?.text ?? "";
  const modules = mergeModules(
    moduleInfosFromPaths(parsedDocuments.map((document) => document.path)),
    inventoryText,
  );

  return {
    name: input.name,
    documents: withInlineReferences,
    modules,
    images,
    duplicateIdentifiers: duplicateIdentifiers(index),
  };
}

export type IdentifierIndex = Map<string, RefTarget[]>;
