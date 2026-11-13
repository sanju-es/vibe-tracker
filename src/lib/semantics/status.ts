import type { Status, StatusKey } from "../model/types";
import { normalizeText } from "../format/text";

interface StatusEntry {
  key: StatusKey;
  literals: readonly string[];
}

/** Closed vocabulary. Anything else is neutral and keeps its literal text. */
const VOCABULARY: readonly StatusEntry[] = [
  { key: "pending", literals: ["pending"] },
  { key: "in-analysis", literals: ["in analysis"] },
  { key: "implementation-proposal", literals: ["implementation proposal"] },
  { key: "in-development", literals: ["in development"] },
  { key: "implemented", literals: ["implemented"] },
  { key: "tested", literals: ["tested"] },
  { key: "blocked", literals: ["blocked"] },
  { key: "active", literals: ["active", "active (permanent)"] },
  { key: "new", literals: ["new"] },
  { key: "in-progress", literals: ["in progress"] },
  { key: "deferred", literals: ["deferred"] },
  { key: "discarded", literals: ["discarded"] },
  { key: "moved", literals: ["moved"] },
  { key: "draft", literals: ["draft"] },
  { key: "proposed", literals: ["proposed"] },
  { key: "approved", literals: ["approved"] },
  { key: "current", literals: ["current"] },
  { key: "superseded", literals: ["superseded"] },
  { key: "archived", literals: ["archived"] },
];

const LOOKUP = new Map<string, StatusKey>();
for (const entry of VOCABULARY) {
  for (const literal of entry.literals) LOOKUP.set(normalizeText(literal), entry.key);
}

const RANK = new Map<StatusKey, number>(
  VOCABULARY.map((entry, index) => [entry.key, index] as const),
);

export function mapStatus(value: string): Status {
  const normalized = normalizeText(value);
  const exact = LOOKUP.get(normalized);
  if (exact) return { value: value.trim(), key: exact };
  // Dated backlog states: `implemented (YYYY-MM-DD)` and `moved (<ID>, YYYY-MM-DD)`.
  const prefix = /^([a-z ]+?)\s*\(/.exec(normalized)?.[1];
  const key = prefix ? (LOOKUP.get(prefix) ?? null) : null;
  return { value: value.trim(), key };
}

/** Sort rank: known statuses by vocabulary order, unknown last. */
export function statusRank(status: Status): number {
  if (status.key === null) return VOCABULARY.length;
  return RANK.get(status.key) ?? VOCABULARY.length;
}

export function isStatusHeader(header: string): boolean {
  const normalized = normalizeText(header);
  return normalized === "status" || normalized === "estado" || normalized === "state";
}

/** Status column detection is by header name only: no guessing from values. */
export function detectStatusColumn(headers: readonly string[]): number | null {
  const index = headers.findIndex((header) => isStatusHeader(header));
  return index >= 0 ? index : null;
}

export function statusKey(value: string): StatusKey | null {
  return LOOKUP.get(normalizeText(value)) ?? null;
}

/** All known keys, for tests and status filters. */
export function vocabularyKeys(): StatusKey[] {
  return VOCABULARY.map((entry) => entry.key);
}
