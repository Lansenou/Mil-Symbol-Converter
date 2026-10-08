/**
 * Opt-in approximate matching (`fuzzy: true`) for 2525C symbols that the strict pipeline cannot
 * map. Nothing here is a documented equivalence: every result is labelled `approximate` (name
 * match) or `lossy` (broader ancestor) and carries a `certainty` between 0 and 1.
 *
 * Certainty of name matches is calibrated, not invented: scripts/calibrate-fuzzy.ts runs the name
 * matcher on symbols whose mapping is known (both sources agree) and records how often each score
 * band picks the right code. CALIBRATION below is that measured precision.
 */
import {
  catalogByKey,
  entitiesOf,
  legacyKey,
  type EditionKey,
} from "../data/index";

const STOP = new Set([
  "and",
  "or",
  "of",
  "the",
  "a",
  "an",
  "with",
  "for",
  "in",
  "on",
  "to",
  "unit",
  "general",
]);

export function words(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/&/g, " and ")
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 1 && !STOP.has(w))
      .map((w) =>
        w.length > 3 && w.endsWith("s") && !w.endsWith("ss")
          ? w.slice(0, -1)
          : w,
      ),
  );
}

/** Dice coefficient of two word sets. */
export function dice(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let common = 0;
  for (const w of a) if (b.has(w)) common++;
  return (2 * common) / (a.size + b.size);
}

/** Similarity between a 2525C description and a catalog name path ("A : B : C"). */
export function nameScore(description: string, path: string): number {
  const d = words(description);
  const leaf = words(path.split(":").pop() ?? "");
  return Math.max(dice(d, leaf), 0.9 * dice(d, words(path)));
}

/** Score tiers, checked in order; a match belongs to the first tier it meets. */
export const TIERS: { minScore: number; minMargin: number }[] = [
  { minScore: 0.9, minMargin: 0.1 },
  { minScore: 0.7, minMargin: 0.2 },
  { minScore: 0.8, minMargin: 0.05 },
  { minScore: 0.6, minMargin: 0.1 },
  { minScore: 0.5, minMargin: 0 },
];

/**
 * Measured precision of each tier (scripts/calibrate-fuzzy.ts against MIL-STD-2525D, symbols whose
 * mapping both sources agree on). Filled in from the calibration run.
 */
export const TIER_PRECISION: number[] = [0.938, 0.744, 0.355, 0.421, 0.286];

/** Calibrated certainty of a name match, or 0 below every tier. */
export function calibratedCertainty(score: number, margin: number): number {
  const i = TIERS.findIndex(
    (t) => score >= t.minScore && margin >= t.minMargin,
  );
  return i < 0 ? 0 : (TIER_PRECISION[i] ?? 0);
}

export interface NameMatch {
  symbolSet: string;
  entity: string;
  name: string;
  score: number;
  /** Score difference to the best entry with a different code. */
  margin: number;
}

/** Best catalog entity for a 2525C description within the given symbol sets. */
export function bestNameMatch(
  edition: EditionKey,
  symbolSets: Iterable<string>,
  description: string,
): NameMatch | undefined {
  const scored: NameMatch[] = [];
  for (const ss of new Set(symbolSets)) {
    for (const [entity, name] of entitiesOf(edition, ss)) {
      scored.push({
        symbolSet: ss,
        entity,
        name,
        score: nameScore(description, name),
        margin: 0,
      });
    }
  }
  scored.sort((a, b) => b.score - a.score || a.entity.localeCompare(b.entity));
  const [best, second] = scored;
  if (!best || best.score === 0) return undefined;
  return { ...best, margin: best.score - (second?.score ?? 0) };
}

/** 2525C ancestors of a SIDC, nearest first, as [sidc, levels up, description]. */
export function ancestors(sidc: string): [string, number, string][] {
  if (sidc[0] === "W") return [];
  const out: [string, number, string][] = [];
  const fn = sidc.slice(4, 10).replace(/-+$/, "");
  for (let len = fn.length - 1; len >= 1; len--) {
    const a =
      sidc.slice(0, 4) + fn.slice(0, len).padEnd(6, "-") + sidc.slice(10);
    const row = catalogByKey.get(legacyKey(a))?.[0];
    if (row) out.push([a, fn.length - len, row.description]);
  }
  return out;
}

import { jmsmlRows, milsymRows } from "../data/index";

/** Symbol sets that 2525C symbols with the same scheme, dimension and first function letter map to. */
const setsByPrefix = new Map<string, Set<string>>();
const prefixOf = (t: string) => `${t[0]}${t[2]}${t[4]}`;
for (const r of jmsmlRows)
  if (!r.retired) {
    const k = prefixOf(r.template);
    setsByPrefix.set(k, (setsByPrefix.get(k) ?? new Set()).add(r.symbolSet));
  }
for (const r of milsymRows) {
  const k = prefixOf(r.basic);
  setsByPrefix.set(k, (setsByPrefix.get(k) ?? new Set()).add(r.symbolSet));
}

export function plausibleSymbolSets(sidc: string): Set<string> {
  return setsByPrefix.get(prefixOf(sidc)) ?? new Set();
}
