#!/usr/bin/env node
/**
 * Documentation audit.
 *
 * Usage:
 *   node scripts/docs-audit.mjs                     audit; every `must` fails
 *   node scripts/docs-audit.mjs --advisory          report without failing
 *   node scripts/docs-audit.mjs --blocking-module NN  enforce only module NN
 *   node scripts/docs-audit.mjs --json              machine-readable output
 *   node scripts/docs-audit.mjs --forbid a,b        extra forbidden terms
 *
 * The historical validations (required documents, placeholders, links, module
 * completeness, agent frontmatter) are always blocking. The rules of
 * `docs/DOC-STANDARD.md` are blocking by default since phase 6 of the migration.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(
    "Usage: node scripts/docs-audit.mjs [--advisory] [--blocking-module NN] [--json] [--forbid term1,term2]",
  );
  console.log("  default        every must fails the command");
  console.log("  --advisory     report findings without failing");
  console.log("  --blocking-module NN  enforce only that module (migration pilot)");
  process.exit(0);
}

const JSON_OUT = args.includes("--json");
const ADVISORY = args.includes("--advisory");

let blockingModules = [];
const moduleIndex = args.indexOf("--blocking-module");
if (moduleIndex !== -1) {
  blockingModules = (args[moduleIndex + 1] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => /^\d{2}$/.test(value));
  if (blockingModules.length === 0) {
    console.error("--blocking-module requires one or more two-digit module numbers.");
    process.exit(2);
  }
}

function inBlockingModule(file) {
  return blockingModules.some((number) => file.startsWith(`docs/modules/${number}-`));
}

let forbidden = [];
const forbidIndex = args.indexOf("--forbid");
if (forbidIndex !== -1) {
  forbidden = (args[forbidIndex + 1] ?? "")
    .split(",")
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);
  if (forbidden.length === 0) {
    console.error("--forbid requires a comma-separated list of terms.");
    process.exit(2);
  }
}

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "vendor",
  ".venv",
  "__pycache__",
  ".idea",
  ".vscode",
  ".opencode/cache",
]);

const TEXT_EXT = new Set([
  ".md",
  ".json",
  ".jsonc",
  ".yml",
  ".yaml",
  ".mjs",
  ".cjs",
  ".js",
  ".ts",
  ".tsx",
  ".vue",
  ".go",
  ".py",
  ".sql",
  ".html",
  ".css",
  ".toml",
  ".mod",
  ".rs",
  ".java",
  ".kt",
  ".php",
  ".rb",
  ".example",
]);

const TEXT_NAMES = new Set(["Dockerfile", ".dockerignore", ".gitignore"]);

/** Findings: { rule, severity, file, line, message, blocking }. */
const findings = [];
let markdownCount = 0;
let linkCount = 0;

function toRel(abs) {
  return path.relative(root, abs).split(path.sep).join("/");
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = toRel(abs);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || SKIP_DIRS.has(rel)) continue;
      walk(abs, out);
      continue;
    }
    if (!entry.isFile()) continue;
    if (
      !TEXT_EXT.has(path.extname(entry.name).toLowerCase()) &&
      !TEXT_NAMES.has(entry.name)
    ) {
      continue;
    }
    out.push(rel);
  }
  return out;
}

function read(rel) {
  return fs
    .readFileSync(path.join(root, rel), "utf8")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n");
}

function add(rule, severity, rel, line, message, blocking = false) {
  findings.push({ rule, severity, file: rel, line, message, blocking });
}

function error(rule, rel, line, message) {
  add(rule, "must", rel, line, message, true);
}

/* ------------------------------------------------------------------ legacy */

function checkRequired() {
  for (const rel of [
    "AGENTS.md",
    "PROJECT_STATE.md",
    "README.md",
    "docs/WORKFLOW.md",
    "docs/ARCHITECTURE.md",
    "docs/DECISIONS.md",
    "docs/DOC-STANDARD.md",
  ]) {
    if (!fs.existsSync(path.join(root, rel)))
      error("legacy", rel, 1, "missing required document");
  }
}

function checkPlaceholders(files) {
  const upperRe = /\{\{[A-Z][A-Z0-9_]*\}\}/g;
  const anyRe = /\{\{[^}\n]{1,80}\}\}/g;
  for (const rel of files) {
    const content = read(rel);
    if (!rel.endsWith(".md")) {
      for (const match of new Set(content.match(anyRe) ?? [])) {
        error("legacy", rel, 1, `unresolved placeholder ${match}`);
      }
      continue;
    }
    let inFence = false;
    content.split("\n").forEach((line, index) => {
      const upper = new Set(line.match(upperRe) ?? []);
      for (const match of upper) {
        error("legacy", rel, index + 1, `unresolved placeholder ${match}`);
      }
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return;
      }
      if (inFence) return;
      const extra = new Set(
        (line.match(anyRe) ?? []).filter(
          (match) => !/^\{\{[A-Z][A-Z0-9_]*\}\}$/.test(match),
        ),
      );
      for (const match of extra) {
        error("legacy", rel, index + 1, `unresolved placeholder ${match}`);
      }
    });
  }
}

function checkFrontmatter(rel, content) {
  const isAgent = rel.startsWith(".opencode/agents/") && rel.endsWith(".md");
  const isSkill = rel.startsWith(".opencode/skills/") && rel.endsWith("/SKILL.md");
  if (!isAgent && !isSkill) return;
  if (!content.startsWith("---\n")) {
    error("legacy", rel, 1, "missing YAML frontmatter");
    return;
  }
  const end = content.indexOf("\n---", 4);
  if (end === -1) {
    error("legacy", rel, 1, "unterminated YAML frontmatter");
    return;
  }
  const frontmatter = content.slice(4, end);
  if (!/^\s*description:/m.test(frontmatter)) {
    error("legacy", rel, 1, "frontmatter is missing description");
  }
}

function checkModules() {
  const modulesDir = path.join(root, "docs/modules");
  if (!fs.existsSync(modulesDir)) {
    error("legacy", "docs/modules", 1, "missing module directory");
    return;
  }
  const standard = [
    "MODULE.md",
    "REQUIREMENTS.md",
    "TECHNICAL.md",
    "CHANGELOG.md",
    "BACKLOG.md",
  ];
  const core = ["MODULE.md", "TECHNICAL.md", "CHANGELOG.md", "BACKLOG.md"];
  for (const entry of fs.readdirSync(modulesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const rel = `docs/modules/${entry.name}`;
    const required = entry.name === "00-core" ? core : standard;
    for (const file of required) {
      if (!fs.existsSync(path.join(root, rel, file))) {
        error("legacy", rel, 1, `missing ${file}`);
      }
    }
  }
}

/* --------------------------------------------------------------- utilities */

function fenceMask(lines) {
  const mask = new Array(lines.length).fill(false);
  let inFence = false;
  lines.forEach((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      mask[index] = true;
      return;
    }
    mask[index] = inFence;
  });
  return mask;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/`|\*|_/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

function headingsOf(rel) {
  const lines = read(rel).split("\n");
  const mask = fenceMask(lines);
  const seen = new Map();
  const slugs = new Set();
  lines.forEach((line, index) => {
    if (mask[index]) return;
    const match = /^(#{1,6})\s+(.*)$/.exec(line);
    if (!match) return;
    const text = match[2].trim();
    let slug = slugify(text);
    const count = seen.get(slug) ?? 0;
    seen.set(slug, count + 1);
    if (count > 0) slug = `${slug}-${count}`;
    slugs.add(slug);
  });
  return slugs;
}

/* ----------------------------------------------------------------- E-01/04 */

function checkLinks(rel, content, slugsCache) {
  const lines = content.split("\n");
  const mask = fenceMask(lines);
  lines.forEach((line, index) => {
    if (mask[index]) return;
    const re = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
    let match;
    while ((match = re.exec(line)) !== null) {
      let target = match[1].trim();
      if (!target || /^(https?:|mailto:|tel:|data:|ftp:|\/\/)/i.test(target)) continue;
      if (target.startsWith("<") && target.endsWith(">")) target = target.slice(1, -1);
      const [rawPath, fragment] = target.split("#");
      const clean = (rawPath ?? "").split("?")[0];
      let decoded = clean;
      try {
        decoded = decodeURIComponent(clean);
      } catch {
        // keep the raw target
      }
      linkCount += 1;

      let targetRel = rel;
      if (decoded !== "") {
        const abs = decoded.startsWith("/")
          ? path.join(root, decoded)
          : path.resolve(path.dirname(path.join(root, rel)), decoded);
        if (!fs.existsSync(abs)) {
          error("E-01", rel, index + 1, `broken link "${match[1]}"`);
          continue;
        }
        targetRel = toRel(abs);
      }

      if (!fragment) continue;
      if (!targetRel.endsWith(".md")) continue;
      const slugs = slugsCache.get(targetRel) ?? headingsOf(targetRel);
      slugsCache.set(targetRel, slugs);
      if (!slugs.has(fragment)) {
        add(
          "E-04",
          "must",
          rel,
          index + 1,
          `unresolved anchor "#${fragment}" in ${targetRel}`,
        );
      }
    }
  });
}

/* ------------------------------------------------------------------ E-05/06 */

function expectedH1(rel) {
  if (rel === "PROJECT_STATE.md") return /^# PROJECT_STATE\.md — Project Tracking$/;
  if (rel === "README.md") return /^# Project Tracking$/;
  if (rel === "AGENTS.md") return /^# AGENTS\.md — Project Tracking$/;
  if (rel === "docs/WORKFLOW.md")
    return /^# WORKFLOW\.md — Project Tracking \(way of working\)$/;
  if (rel === "docs/ARCHITECTURE.md") return /^# ARCHITECTURE\.md — Project Tracking$/;
  if (rel === "docs/DECISIONS.md") return /^# DECISIONS\.md — Project Tracking$/;
  if (rel === "docs/DOC-STANDARD.md") return /^# Documentation standard — v\d+\.\d+$/;
  const module = /^docs\/modules\/(\d{2})-[a-z0-9-]+\//.exec(rel);
  if (module) {
    const nn = module[1];
    const file = path.basename(rel);
    if (file === "MODULE.md") return new RegExp(`^# Module ${Number(nn)} — .+$`);
    if (
      ["REQUIREMENTS.md", "TECHNICAL.md", "CHANGELOG.md", "BACKLOG.md"].includes(file)
    ) {
      return new RegExp(`^# Module ${Number(nn)} — ${file.replace(".md", "")}$`);
    }
  }
  return null;
}

const FRONT_KEYS = [
  "**Purpose:**",
  "**Read when:**",
  "**Canonical for:**",
  "**Do not duplicate:**",
];

function isExemptFromFrontBlock(rel) {
  return (
    rel === "README.md" ||
    rel.endsWith("CHANGELOG.md") ||
    rel.startsWith(".opencode/agents/") ||
    rel.startsWith(".opencode/skills/")
  );
}

function checkHeader(rel, content) {
  const lines = content.split("\n");
  const expected = expectedH1(rel);
  if (expected) {
    const first =
      lines.find((line) => line.trim() !== "" && !line.trim().startsWith("<!--")) ?? "";
    if (!expected.test(first.trim())) {
      add("E-05", "must", rel, 1, `H1 does not match the registry: "${first.trim()}"`);
    }
  }
  if (isExemptFromFrontBlock(rel)) {
    if (rel.endsWith("CHANGELOG.md") && !content.includes("**History:** append-only")) {
      add("E-06", "must", rel, 1, "missing front-block key **History:** append-only");
    }
    return;
  }
  const normalized = content.split("\n").map((line) => line.replace(/^\s*>\s?/, ""));
  for (const key of FRONT_KEYS) {
    if (!normalized.some((line) => line.startsWith(key))) {
      add("E-06", "must", rel, 1, `missing front-block key ${key}`);
    }
  }
}

/* ------------------------------------------------------------------ E-07 */

const SLOT_CATALOGUE = [
  {
    match: (rel) => rel === "PROJECT_STATE.md",
    required: [
      "Project",
      "Stack and environment",
      "Architecture (one line)",
      "Way of working",
      "Quick links",
      "Module inventory and state",
      "Open problems and pending corrections",
      "Development credentials and data",
      "Next steps",
    ],
  },
  {
    match: (rel) => rel === "docs/WORKFLOW.md",
    required: [
      "Incremental development",
      "Per-module cycle",
      "Module states and lifecycle",
      "Change management",
      "Version control and commits",
      "Documentation honesty",
      "Documentation maintenance",
    ],
  },
  {
    match: (rel) => rel === "docs/ARCHITECTURE.md",
    required: [
      "System overview",
      "Principles",
      "Code organization",
      "Communication",
      "Data layer",
      "Data model",
      "Conventions",
      "Repository layout",
      "Environments and operations",
      "Quality gates",
    ],
  },
  {
    match: (rel) => rel === "docs/DECISIONS.md",
    slots: [
      { number: 1, title: "Approved decisions" },
      { number: 2, title: "Adopted by default" },
      { number: 3, title: "Conditioning design requirements", optional: true },
      { number: 4, title: "Open questions" },
      { number: 5, title: "Decision history" },
    ],
  },
  {
    match: (rel) => rel === "AGENTS.md",
    required: [
      "Onboarding",
      "Immediate rules",
      "Quality routing",
      "Project rules",
      "Documentation map",
      "Minimum documentation load",
    ],
  },
  {
    match: (rel) => rel === "docs/DOC-STANDARD.md",
    required: [
      "Scope, authority and language",
      "Rule identifiers",
      "Universal skeleton",
      "Tables",
      "Vocabularies",
      "Identifiers and references",
      "Canonical skeletons",
      "Lifecycle coverage",
      "Agent contract",
      "Enforcement",
      "Migration",
      "Governance",
      "Change history",
    ],
  },
  {
    match: (rel) => rel === "docs/modules/00-core/MODULE.md",
    slots: [
      { number: 1, title: "Purpose" },
      { number: 2, title: "Scope" },
      { number: 3, title: "Boundary rule", optional: true },
      { number: 4, title: "Invariants (CR-NN)", optional: true },
      { number: 5, title: "Delivered features", optional: true },
      { number: 6, title: "Documentation map" },
      { number: 7, title: "Decisions" },
      { number: 9, title: "Next step" },
      { number: 10, title: "Module-specific notes", optional: true },
    ],
  },
  {
    match: (rel) => /^docs\/modules\/\d{2}-[a-z0-9-]+\/MODULE\.md$/.test(rel),
    slots: [
      { number: 1, title: "Purpose" },
      { number: 2, title: "Scope" },
      { number: 3, title: "Actors and screens", optional: true },
      { number: 4, title: "Domain model", optional: true },
      { number: 5, title: "Delivered features", optional: true },
      { number: 6, title: "Documentation map" },
      { number: 7, title: "Decisions" },
      { number: 8, title: "Risks and known limitations", optional: true },
      { number: 9, title: "Next step" },
      { number: 10, title: "Module-specific notes", optional: true },
    ],
  },
  {
    match: (rel) => rel.endsWith("/REQUIREMENTS.md"),
    slots: [
      { number: 1, title: "Goal" },
      { number: 2, title: "Functional requirements" },
      { number: 3, title: "Business rules" },
      { number: 4, title: "Flows", optional: true },
      { number: 5, title: "Validations", optional: true },
      { number: 6, title: "Edge cases" },
      { number: 7, title: "Out of scope", optional: true },
      { number: 8, title: "Dependencies", optional: true },
      { number: 9, title: "Acceptance criteria" },
      { number: 10, title: "Module-specific notes", optional: true },
    ],
  },
  {
    match: (rel) => rel.endsWith("/TECHNICAL.md"),
    slots: [
      { number: 1, title: "Design and principles" },
      { number: 2, title: "Surface" },
      { number: 3, title: "Data", optional: true },
      { number: 4, title: "Implementation", optional: true },
      { number: 5, title: "Interaction and behaviour", optional: true },
      { number: 6, title: "Tests and evidence" },
      { number: 7, title: "Limits and known limitations" },
      { number: 8, title: "Implementation status", optional: true },
      { number: 9, title: "Risks", optional: true },
      { number: 10, title: "Module-specific notes", optional: true },
    ],
  },
  {
    match: (rel) => rel.endsWith("/BACKLOG.md"),
    required: ["Entries", "States", "Types"],
    optional: ["Notes"],
  },
];

function moduleState(rel) {
  const file = path.join(root, path.dirname(rel), "MODULE.md");
  if (!fs.existsSync(file)) return null;
  const content = fs.readFileSync(file, "utf8");
  const token = /\*\*Status:\*\*\s*`([^`\n]+)`/.exec(content);
  if (token) return token[1].trim();
  const bare = /\*\*Status:\*\*\s*([^`(\n]+)/.exec(content);
  return bare ? bare[1].trim() : null;
}

function checkSlots(rel, content) {
  const entry = SLOT_CATALOGUE.find((candidate) => candidate.match(rel));
  if (!entry) return;
  const lines = content.split("\n");
  const mask = fenceMask(lines);
  const slots = [];
  lines.forEach((line, index) => {
    if (mask[index]) return;
    const match = /^## (\d+)\.\s+(.+)$/.exec(line);
    if (match)
      slots.push({ number: Number(match[1]), title: match[2].trim(), line: index + 1 });
  });

  let previous = 0;
  for (const slot of slots) {
    if (slot.number <= previous) {
      add("E-07", "must", rel, slot.line, `slot ${slot.number} is out of order`);
    }
    previous = slot.number;
  }

  const expected = entry.slots ?? [
    ...entry.required.map((title, index) => ({ number: index + 1, title })),
    ...(entry.optional ?? []).map((title, index) => ({
      number: entry.required.length + index + 1,
      title,
      optional: true,
    })),
  ];

  if (rel.endsWith("/REQUIREMENTS.md")) {
    const state = moduleState(rel);
    const built = state === "Implemented" || state === "Tested";
    for (const slot of expected) {
      if (slot.number === 9 && slot.title === "Acceptance criteria")
        slot.optional = !built;
    }
  }

  for (const slot of expected) {
    const found = slots.find((candidate) => candidate.number === slot.number);
    if (!found) {
      if (!slot.optional)
        add("E-07", "must", rel, 1, `missing slot ${slot.number}: ${slot.title}`);
      continue;
    }
    if (found.title.toLowerCase() !== slot.title.toLowerCase()) {
      add(
        "E-07",
        "should",
        rel,
        found.line,
        `slot ${slot.number} should be "${slot.title}", found "${found.title}"`,
      );
    }
  }
}

/* ------------------------------------------------------------------ E-08 */

function tableAt(content, lineIndexes) {
  const lines = content.split("\n");
  for (const index of lineIndexes) {
    if (!/^\|.*\|\s*$/.test(lines[index] ?? "")) continue;
    if (!/^\|[-: |]+\|\s*$/.test(lines[index + 1] ?? "")) continue;
    const cells = (line) =>
      line
        .replace(/^\||\|$/g, "")
        .split(/(?<!\\)\|/)
        .map((cell) => cell.trim());
    return { header: cells(lines[index]), line: index + 1 };
  }
  return null;
}

function sectionTables(rel, content, sectionTitle) {
  const lines = content.split("\n");
  const mask = fenceMask(lines);
  const start = lines.findIndex(
    (line, index) =>
      !mask[index] &&
      /^##\s/.test(line) &&
      line.toLowerCase().includes(sectionTitle.toLowerCase()),
  );
  if (start === -1) return [];
  const tables = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (!mask[index] && /^##\s/.test(lines[index])) break;
    if (
      /^\|.*\|\s*$/.test(lines[index]) &&
      /^\|[-: |]+\|\s*$/.test(lines[index + 1] ?? "")
    ) {
      const header = lines[index]
        .replace(/^\||\|$/g, "")
        .split(/(?<!\\)\|/)
        .map((cell) => cell.trim());
      tables.push({ header, line: index + 1 });
      index += 1;
    }
  }
  return tables;
}

function checkTableHeaders(rel, content) {
  const requireExact = (table, expected, label) => {
    if (!table) {
      add("E-08", "must", rel, 1, `${label}: table not found`);
      return;
    }
    if (table.header.length !== expected.length) {
      add(
        "E-08",
        "must",
        rel,
        table.line,
        `${label}: expected ${expected.length} columns`,
      );
      return;
    }
    expected.forEach((column, index) => {
      if (table.header[index] !== column) {
        add(
          "E-08",
          "must",
          rel,
          table.line,
          `${label}: column ${index + 1} should be "${column}"`,
        );
      }
    });
  };

  if (rel.endsWith("/BACKLOG.md")) {
    requireExact(
      tableAt(
        content,
        content.split("\n").map((_, index) => index),
      ),
      ["ID", "Date", "Type", "Description", "Origin", "Priority", "Status"],
      "backlog entries",
    );
  }
  if (rel === "docs/DECISIONS.md") {
    const approved = sectionTables(rel, content, "Approved decisions")[0] ?? null;
    requireExact(approved, ["#", "Date", "Decision", "Context / reason"], "decisions");
  }
  if (rel === "PROJECT_STATE.md") {
    const inventory = sectionTables(rel, content, "Module inventory")[0] ?? null;
    requireExact(
      inventory,
      ["#", "Module", "State", "Open items", "Documentation"],
      "module inventory",
    );
  }
  if (rel === "docs/modules/00-core/MODULE.md") {
    const invariants = sectionTables(rel, content, "Invariants")[0] ?? null;
    requireExact(invariants, ["ID", "Invariant", "Source of truth"], "core invariants");
  }
  if (rel.endsWith("/REQUIREMENTS.md")) {
    const acceptance = sectionTables(rel, content, "Acceptance")[0] ?? null;
    if (acceptance) {
      requireExact(acceptance, ["FR", "Criterion", "Evidence", "Status"], "acceptance");
    }
  }
  if (rel === "docs/DOC-STANDARD.md") {
    const history = sectionTables(rel, content, "Change history")[0] ?? null;
    requireExact(history, ["Date", "Version", "Change"], "standard history");
  }
}

/* ------------------------------------------------------------------ E-09/10 */

const MODULE_STATES = new Set([
  "Pending",
  "In analysis",
  "Implementation proposal",
  "In development",
  "Implemented",
  "Tested",
  "Blocked",
  "Active (permanent)",
]);

const BACKLOG_STATUS =
  /^(new|in progress|blocked|deferred|implemented \(\d{4}-\d{2}-\d{2}\)|moved \([^)]+, \d{4}-\d{2}-\d{2}\)|discarded)$/;

function cleanCell(value) {
  return value.replace(/[*`]/g, "").trim();
}

function checkVocabulary(rel, content) {
  if (rel === "PROJECT_STATE.md") {
    const inventory = sectionTables(rel, content, "Module inventory")[0];
    if (!inventory) return;
    const lines = content.split("\n");
    for (let index = inventory.line + 1; index < lines.length; index += 1) {
      const line = lines[index];
      if (!/^\|/.test(line)) continue;
      const cells = line
        .replace(/^\||\|$/g, "")
        .split(/(?<!\\)\|/)
        .map((cell) => cell.trim());
      if (cells.length < 3 || /^-+$/.test(cells[0] ?? "")) continue;
      const state = cleanCell(cells[2] ?? "");
      if (state !== "" && !MODULE_STATES.has(state)) {
        add("E-09", "must", rel, index + 1, `unknown module state "${state}"`);
      }
    }
  }

  if (rel.endsWith("/BACKLOG.md")) {
    const table = tableAt(
      content,
      content.split("\n").map((_, index) => index),
    );
    if (!table) return;
    const statusColumn = table.header.indexOf("Status");
    if (statusColumn === -1) return;
    const lines = content.split("\n");
    for (let index = table.line + 1; index < lines.length; index += 1) {
      const line = lines[index];
      if (!/^\|/.test(line)) continue;
      const cells = line
        .replace(/^\||\|$/g, "")
        .split(/(?<!\\)\|/)
        .map((cell) => cell.trim());
      if (cells.length <= statusColumn || /^-+$/.test(cells[0] ?? "")) continue;
      const status = cleanCell(cells[statusColumn] ?? "");
      if (status === "" || status === "—") continue;
      if (!BACKLOG_STATUS.test(status)) {
        add("E-09", "must", rel, index + 1, `unknown backlog status "${status}"`);
      }
    }
  }
}

function checkDates(rel, content) {
  const lines = content.split("\n");
  lines.forEach((line, index) => {
    const lastUpdate = /^\*\*Last update:\*\*\s*(\S+)/.exec(line);
    if (lastUpdate && !/^\d{4}-\d{2}-\d{2}$/.test(lastUpdate[1])) {
      add(
        "E-10",
        "must",
        rel,
        index + 1,
        `Last update is not YYYY-MM-DD: ${lastUpdate[1]}`,
      );
    }
    if (/^\|/.test(line)) {
      const cells = line
        .replace(/^\||\|$/g, "")
        .split(/(?<!\\)\|/)
        .map((cell) => cell.trim());
      for (const cell of cells) {
        if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(cell)) {
          add("E-10", "must", rel, index + 1, `date is not YYYY-MM-DD: ${cell}`);
        }
      }
    }
  });
}

/* ------------------------------------------------------------------ E-11/12 */

const MODULE_PREFIX = /^(FR|BR|VAL|MS|B)-(\d{1,3})$/;

function definitions(files) {
  const owners = new Map();
  for (const rel of files) {
    if (!rel.endsWith(".md") || rel === "docs/DOC-STANDARD.md") continue;
    const lines = read(rel).split("\n");
    const mask = fenceMask(lines);
    lines.forEach((line, index) => {
      if (mask[index]) return;
      let id = null;
      const list =
        /^\s*(?:[-*]\s+)?(?:\*\*)?([A-Z]{1,5}-\d{1,3})(?:\*\*)?\s*(?:—|–|-|:)/.exec(line);
      if (list) id = list[1];
      if (/^\|/.test(line)) {
        const first = line
          .replace(/^\||\|$/g, "")
          .split(/(?<!\\)\|/)[0]
          ?.replace(/[*`]/g, "")
          .trim();
        if (first && /^[A-Z]{1,5}-\d{1,3}$/.test(first)) id = first;
      }
      if (!id) return;
      if (!owners.has(id)) owners.set(id, new Set());
      owners.get(id).add(rel);
    });
  }
  return owners;
}

function moduleFolders() {
  const modulesDir = path.join(root, "docs/modules");
  const map = new Map();
  for (const entry of fs.readdirSync(modulesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const match = /^(\d{2})-/.exec(entry.name);
    if (match) map.set(match[1], `docs/modules/${entry.name}`);
  }
  return map;
}

function checkReferences(files) {
  const owners = definitions(files);
  const folders = moduleFolders();

  for (const rel of files) {
    if (!rel.endsWith(".md")) continue;
    if (rel === "docs/DOC-STANDARD.md") continue;
    const lines = read(rel).split("\n");
    const mask = fenceMask(lines);
    lines.forEach((line, index) => {
      if (mask[index]) return;
      let match;
      const globalQualified = /(?:^|[^\w-])\d{2}\s+((?:D|CORE|CR)-\d{1,3})\b/g;
      while ((match = globalQualified.exec(line)) !== null) {
        add(
          "E-11",
          "must",
          rel,
          index + 1,
          `${match[1]} is global and must never be qualified`,
        );
      }
      const globalShort = /(?:^|[^\w-])((?:D|CORE|CR)-\d)(?![\d])/g;
      while ((match = globalShort.exec(line)) !== null) {
        add(
          "E-11",
          "must",
          rel,
          index + 1,
          `global identifier ${match[1]} needs two digits`,
        );
      }
      const qualified = /(?:^|[^\w-])(\d{2})\s+((?:FR|BR|VAL|MS|B)-\d{1,3})\b/g;
      while ((match = qualified.exec(line)) !== null) {
        const folder = folders.get(match[1]);
        const id = match[2];
        const owner = owners.get(id);
        if (!folder) {
          add(
            "E-11",
            "must",
            rel,
            index + 1,
            `module ${match[1]} does not exist for ${id}`,
          );
          continue;
        }
        if (!owner || ![...owner].some((file) => file.startsWith(folder))) {
          add(
            "E-11",
            "must",
            rel,
            index + 1,
            `${match[1]} ${id} is not defined in that module`,
          );
        }
      }
      const hasQualified = /(?:^|[^\w-])\d{2}\s+(?:FR|BR|VAL|MS|B)-\d{1,3}\b/.test(line);
      const bare = /(?:^|[^\w-])((?:FR|BR|VAL|MS|B)-\d{1,3})\b/g;
      while ((match = bare.exec(line)) !== null) {
        const id = match[1];
        if (hasQualified) continue;
        if (!MODULE_PREFIX.test(id)) continue;
        const owner = owners.get(id);
        if (!owner) continue;
        if (!owner.has(rel)) {
          add("E-12", "must", rel, index + 1, `bare ${id} outside its owning file`);
        }
      }
    });
  }
}

/* ------------------------------------------------------------------ E-13 */

const LEGACY_ID = /\b(P|DEF|IMP|A|N|I|Q|M)-\d{1,3}\b/g;

function checkRulePrefixes(files) {
  for (const rel of files) {
    if (!rel.endsWith(".md") || rel === "docs/DOC-STANDARD.md") continue;
    const lines = read(rel).split("\n");
    const mask = fenceMask(lines);
    lines.forEach((line, index) => {
      if (mask[index]) return;
      for (const id of line.match(LEGACY_ID) ?? []) {
        add("E-13", "must", rel, index + 1, `legacy identifier prefix ${id}`);
      }
    });
  }
}

/* ------------------------------------------------------------------ E-14/15 */

function checkTableCells(files) {
  for (const rel of files) {
    if (!rel.endsWith(".md")) continue;
    const lines = read(rel).split("\n");
    const mask = fenceMask(lines);
    lines.forEach((line, index) => {
      if (mask[index] || !/^\|/.test(line)) return;
      if (/^\|[-: |]+\|\s*$/.test(line)) return;
      const cells = line
        .replace(/^\||\|$/g, "")
        .split(/(?<!\\)\|/)
        .map((cell) => cell.trim());
      for (const cell of cells) {
        if (cell === "") {
          add("E-14", "must", rel, index + 1, "empty table cell");
          break;
        }
        if (cell.length > 600) {
          add(
            "E-15",
            "should",
            rel,
            index + 1,
            `cell longer than 600 characters (${cell.length})`,
          );
        }
      }
      if (
        /(?<!\\)\|/.test(line.replace(/^\||\|$/g, "")) === false &&
        line.includes("||")
      ) {
        add("E-14", "must", rel, index + 1, "unescaped pipe or empty cell");
      }
    });
  }
}

/* ------------------------------------------------------------------ E-16/17 */

function checkLastUpdate(rel, content) {
  const module = /^docs\/modules\/(\d{2})-[a-z0-9-]+\/[A-Z]+\.md$/.exec(rel);
  if (!module) return;
  const update = /^\*\*Last update:\*\*\s*(\d{4}-\d{2}-\d{2})/m.exec(content);
  if (!update) return;
  const changelog = `docs/modules/${path.basename(path.dirname(rel))}/CHANGELOG.md`;
  if (!fs.existsSync(path.join(root, changelog))) return;
  const dates = [...read(changelog).matchAll(/^## (\d{4}-\d{2}-\d{2})/gm)].map(
    (entry) => entry[1],
  );
  if (dates.length === 0) return;
  const newest = dates.sort().at(-1);
  if (newest && update[1] < newest) {
    add(
      "E-16",
      "should",
      rel,
      1,
      `Last update ${update[1]} is older than the newest changelog entry ${newest}`,
    );
  }
}

const SPANISH =
  /\b(el|la|los|las|del|que|para|con|una|uno|por|como|más|pero|está|están|desde|hasta|sin|sobre|entre|cuando|donde)\b/i;

function checkLanguage(files) {
  for (const rel of files) {
    if (!rel.startsWith("docs/") || !rel.endsWith(".md")) continue;
    const lines = read(rel).split("\n");
    const mask = fenceMask(lines);
    lines.forEach((line, index) => {
      if (mask[index]) return;
      const withoutCode = line.replace(/`[^`]*`/g, "");
      const match = SPANISH.exec(withoutCode);
      if (match) {
        add("E-17", "should", rel, index + 1, `possible Spanish stopword "${match[1]}"`);
      }
    });
  }
}

/* ------------------------------------------------------------------ E-19 */

const DUPLICATE_MIN = 100;

function checkDuplicatedBlocks(files) {
  const seen = new Map();
  for (const rel of files) {
    if (!rel.endsWith(".md")) continue;
    if (rel.endsWith("/CHANGELOG.md")) continue;
    if (rel.startsWith(".opencode/")) continue;
    const lines = read(rel).split("\n");
    const mask = fenceMask(lines);
    let block = null;
    const flush = () => {
      if (!block) return;
      const text = block.text.replace(/\s+/g, " ").trim();
      const line = block.line;
      block = null;
      if (text.length < DUPLICATE_MIN) return;
      if (/^\[/.test(text)) return;
      if (!seen.has(text)) seen.set(text, []);
      const folder = /^docs\/modules\/(\d{2})-[a-z0-9-]+\//.exec(rel);
      seen.get(text).push({ rel, line, scope: folder ? folder[1] : "global" });
    };
    lines.forEach((line, index) => {
      if (mask[index]) {
        flush();
        return;
      }
      const trimmed = line.trim();
      if (
        trimmed === "" ||
        trimmed === "---" ||
        /^#/.test(trimmed) ||
        /^\|/.test(trimmed) ||
        /^>/.test(trimmed)
      ) {
        flush();
        return;
      }
      const content = trimmed.replace(/^(?:[-*]\s+|\d+\.\s+)/, "");
      const isItem = content !== trimmed;
      if (isItem || !block) {
        flush();
        block = { text: content, line: index + 1 };
        return;
      }
      block.text += ` ${content}`;
    });
    flush();
  }

  for (const occurrences of seen.values()) {
    if (occurrences.length < 2) continue;
    const firstByScope = new Map();
    let firstAny = null;
    for (const hit of occurrences) {
      const conflict =
        hit.scope === "global"
          ? firstAny
          : (firstByScope.get(hit.scope) ?? firstByScope.get("global"));
      if (conflict) {
        add(
          "E-19",
          "must",
          hit.rel,
          hit.line,
          `prose block duplicated from ${conflict.rel}:${conflict.line}`,
        );
      }
      if (!firstByScope.has(hit.scope)) firstByScope.set(hit.scope, hit);
      firstAny ??= hit;
    }
  }
}

/* ------------------------------------------------------------------ E-20 */

const PATH_SPAN = /`([\w.@/-]+\.(?:ts|mjs|js|json|svelte|css|html))`/g;

function checkPathSpans(files) {
  for (const rel of files) {
    if (!rel.endsWith(".md")) continue;
    const lines = read(rel).split("\n");
    const mask = fenceMask(lines);
    lines.forEach((line, index) => {
      if (mask[index]) return;
      for (const match of line.matchAll(PATH_SPAN)) {
        const target = match[1];
        if (!target.includes("/")) continue;
        if (/[*<>]/.test(target)) continue;
        if (/^@/.test(target) || target.includes("://")) continue;
        if (target.startsWith("dist/") || target.startsWith("node_modules/")) continue;
        const bases = [path.dirname(rel), "", "src", "docs", "tests", "scripts"];
        const exists = bases.some((base) => fs.existsSync(path.join(root, base, target)));
        if (exists) continue;
        add("E-20", "must", rel, index + 1, `code span names a missing path: ${target}`);
      }
    });
  }
}

/* -------------------------------------------------------------------- main */

function main() {
  const files = walk(root);
  const markdown = files.filter((rel) => rel.endsWith(".md"));
  markdownCount = markdown.length;

  checkRequired();
  checkPlaceholders(files);
  checkModules();

  const slugsCache = new Map();
  for (const rel of markdown) {
    const content = read(rel);
    if (content.trim().length < 20)
      error("legacy", rel, 1, "document is empty or too short");
    checkFrontmatter(rel, content);
    checkLinks(rel, content, slugsCache);
    checkHeader(rel, content);
    checkSlots(rel, content);
    checkTableHeaders(rel, content);
    checkVocabulary(rel, content);
    checkDates(rel, content);
    checkTableCells([rel]);
    checkLastUpdate(rel, content);
  }

  checkReferences(files);
  checkRulePrefixes(files);
  checkDuplicatedBlocks(files);
  checkPathSpans(files);
  checkLanguage(files);

  if (forbidden.length > 0) {
    for (const rel of files) {
      const lines = read(rel).split("\n");
      lines.forEach((line, index) => {
        const lower = line.toLowerCase();
        for (const term of forbidden) {
          if (lower.includes(term))
            error("legacy", rel, index + 1, `forbidden term "${term}"`);
        }
      });
    }
  }

  const must = findings.filter((finding) => finding.severity === "must");
  const should = findings.filter((finding) => finding.severity === "should");
  const blocking = findings.filter(
    (finding) =>
      finding.blocking ||
      (!ADVISORY &&
        finding.severity === "must" &&
        (blockingModules.length === 0 || inBlockingModule(finding.file))),
  );
  const byRule = new Map();
  for (const finding of findings) {
    byRule.set(finding.rule, (byRule.get(finding.rule) ?? 0) + 1);
  }

  const sorted = [...findings].sort(
    (a, b) =>
      a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule),
  );

  if (JSON_OUT) {
    console.log(
      JSON.stringify(
        {
          files: markdownCount,
          links: linkCount,
          failures: sorted.map(
            ({ rule, severity, file, line, message, blocking: isBlocking }) => ({
              file,
              line,
              rule,
              severity,
              message,
              blocking: Boolean(
                isBlocking ||
                (!ADVISORY &&
                  severity === "must" &&
                  (blockingModules.length === 0 || inBlockingModule(file))),
              ),
            }),
          ),
          summary: {
            blocking: blocking.length,
            wouldBlock: must.length,
            must: must.length,
            should: should.length,
            byRule: Object.fromEntries([...byRule.entries()].sort()),
            mode: ADVISORY
              ? "advisory"
              : blockingModules.length > 0
                ? `blocking:${blockingModules.join(",")}`
                : "blocking",
          },
        },
        null,
        2,
      ),
    );
  } else {
    if (blocking.length > 0) {
      console.error(
        `\nDocumentation audit failed: ${blocking.length} blocking finding(s)\n`,
      );
      for (const finding of blocking) {
        console.error(
          `  - ${finding.file}:${finding.line} [${finding.rule}] ${finding.message}`,
        );
      }
    }

    if (findings.length > 0) {
      const label = ADVISORY ? "advisory findings" : "findings";
      console.log(
        `\n${label}: ${findings.length} (${must.length} must, ${should.length} should)`,
      );
      for (const [rule, count] of [...byRule.entries()].sort()) {
        console.log(`  - ${rule}: ${count}`);
      }
      if (ADVISORY) {
        console.log(
          "\nAdvisory mode: these findings do not fail the command. The default mode enforces every must.",
        );
      }
      if (!ADVISORY && blockingModules.length > 0) {
        console.log(
          `\nPilot mode: only must findings in module(s) ${blockingModules.join(", ")} fail the command.`,
        );
      }
    }

    const status = blocking.length === 0 ? "passed" : "failed";
    console.log(
      `\nDocumentation audit ${status}: ${markdownCount} markdown file(s), ${linkCount} relative link(s).`,
    );
  }

  if (blocking.length > 0) process.exitCode = 1;
}

main();
