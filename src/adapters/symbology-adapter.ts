/**
 * Mapping evidence adapters.
 *
 * The converter never talks to a dataset directly; it asks every registered adapter for the
 * 2525C -> numeric evidence it holds for a SIDC. Each adapter reports what its source says and
 * which edition that answer is native to. Swapping or adding a source (for example another
 * open-source converter) means implementing this interface, not changing the converter.
 */
import {
  jmsmlByKey,
  legacyKey,
  milsymByKey,
  type EditionKey,
  type JmsmlRow,
  type MilsymRow,
} from "../data/index";
import type { MappingSourceName } from "../types";

export interface MappingEvidence {
  source: MappingSourceName;
  /** Catalog edition whose names define the meaning of this answer. */
  nativeEdition: EditionKey;
  /** SIDC version digits the source assigns to the answer. */
  version: string;
  /** The source's template that matched the input. */
  template: string;
  /** The source says the 2525C symbol has no counterpart (retired). */
  retired: boolean;
  symbolSet: string;
  entity: string;
  m1: string;
  m2: string;
  /**
   * Number of distinct 2525C symbols this source maps to the same numeric code. More than one
   * means the target merged a 2525C distinction.
   */
  fanIn: number;
  /** Among merged symbols, this one is the source's primary (labelled) symbol. */
  canonical: boolean;
}

export interface MappingAdapter {
  readonly name: MappingSourceName;
  readonly description: string;
  lookup(sidc: string): MappingEvidence[];
}

const codeOf = (r: { symbolSet: string; entity: string; m1: string; m2: string }) =>
  `${r.symbolSet}${r.entity}${r.m1}${r.m2}`;

// ----------------------------------------------------------------------------------------------
// JMSML

const jmsmlFanIn = new Map<string, Map<string, boolean>>(); // code -> (key -> any label row)
for (const [key, rows] of jmsmlByKey) {
  for (const r of rows) {
    if (r.retired) continue;
    const code = codeOf(r);
    const m = jmsmlFanIn.get(code) ?? new Map<string, boolean>();
    m.set(key, (m.get(key) ?? false) || r.label);
    jmsmlFanIn.set(code, m);
  }
}

/**
 * In JMSML, positions 2 and 4 of a label are only meaningful when rows of the same function ID
 * differ in them (e.g. FLOT friendly/hostile, present/planned). Otherwise the "P" in labels such
 * as S*GPUCI---***** is the catalog convention for "any status".
 */
const jmsmlConstrained = new Map<string, boolean>();
for (const [key, rows] of jmsmlByKey) {
  const variants = new Set(rows.map((r) => `${r.template[1] ?? ""}${r.template[3] ?? ""}`));
  jmsmlConstrained.set(key, variants.size > 1);
}

function jmsmlSpecificity(row: JmsmlRow, sidc: string, constrained: boolean): number {
  if (row.template[0] === "W") return row.template === sidc ? 1 : -1;
  let score = 0;
  if (constrained) {
    for (const p of [1, 3]) {
      const t = row.template[p];
      if (t === "*") continue;
      if (t !== sidc[p]) return -1;
      score++;
    }
  }
  return score;
}

export const jmsmlAdapter: MappingAdapter = {
  name: "JMSML",
  description:
    "Esri Joint Military Symbology XML: <LegacySymbol> links from 2525C to the MIL-STD-2525D (version 10) catalog.",
  lookup(sidc) {
    const key = legacyKey(sidc);
    const rows = jmsmlByKey.get(key) ?? [];
    const constrained = jmsmlConstrained.get(key) ?? false;
    const scored = rows
      .map((r) => ({ r, s: jmsmlSpecificity(r, sidc, constrained) }))
      .filter((x) => x.s >= 0);
    const best = Math.max(-1, ...scored.map((x) => x.s));
    let matches = scored.filter((x) => x.s === best).map((x) => x.r);
    // A retired duplicate row does not outweigh a live mapping of the same template.
    if (matches.some((r) => !r.retired)) matches = matches.filter((r) => !r.retired);
    const seen = new Set<string>();
    const out: MappingEvidence[] = [];
    for (const r of matches) {
      const code = r.retired ? "retired" : codeOf(r);
      if (seen.has(code)) continue;
      seen.add(code);
      const group = r.retired ? undefined : jmsmlFanIn.get(code);
      const labelled = group ? [...group.values()].filter(Boolean).length : 0;
      out.push({
        source: "JMSML",
        nativeEdition: "2525D",
        version: "10",
        template: r.template,
        retired: r.retired,
        symbolSet: r.symbolSet,
        entity: r.entity,
        m1: r.m1,
        m2: r.m2,
        fanIn: group?.size ?? 0,
        canonical: !!group && (group.size === 1 || (r.label && labelled === 1)),
      });
    }
    return out;
  },
};

// ----------------------------------------------------------------------------------------------
// mil-sym-ts

const milsymFanIn = new Map<string, Set<string>>();
for (const [key, rows] of milsymByKey) {
  for (const r of rows) {
    const code = codeOf(r);
    const s = milsymFanIn.get(code) ?? new Set<string>();
    s.add(key);
    milsymFanIn.set(code, s);
  }
}

const MILSYM_EDITIONS: Record<string, EditionKey> = {
  "10": "APP-6D",
  "11": "2525Dch1",
  "15": "2525Ech1",
  "16": "APP-6Ech2",
};

export const milsymAdapter: MappingAdapter = {
  name: "mil-sym-ts",
  description:
    "US Army C5ISR mil-sym-ts c2d.json: 2525C basic symbol IDs mapped to 2525D Change 1 codes (a few rows to APP-6D or 2525E codes).",
  lookup(sidc) {
    const rows: MilsymRow[] = milsymByKey.get(legacyKey(sidc)) ?? [];
    const seen = new Set<string>();
    const out: MappingEvidence[] = [];
    for (const r of rows) {
      const code = codeOf(r);
      const edition = MILSYM_EDITIONS[r.version];
      if (seen.has(code) || !edition) continue;
      seen.add(code);
      const fanIn = milsymFanIn.get(code)?.size ?? 1;
      out.push({
        source: "mil-sym-ts",
        nativeEdition: edition,
        version: r.version,
        template: r.basic,
        retired: false,
        symbolSet: r.symbolSet,
        entity: r.entity,
        m1: r.m1,
        m2: r.m2,
        fanIn,
        canonical: fanIn === 1,
      });
    }
    return out;
  },
};

export const defaultAdapters: readonly MappingAdapter[] = [jmsmlAdapter, milsymAdapter];
