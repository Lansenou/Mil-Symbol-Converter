/**
 * Numeric SIDC (MIL-STD-2525D/E, APP-6(D)/(E)) -> 15-character MIL-STD-2525C.
 *
 * There is no separate reverse table. The forward converter is the referee: candidates are
 * proposed from an index of what every 2525C table entry converts to, and a candidate is only
 * accepted if converting it forward reproduces the input code exactly. Everything the forward
 * direction knows (source disagreements, contested codes, renumbered and common modifiers) is
 * therefore honoured in reverse as well, and the two directions cannot drift apart.
 */
import { catalog, catalogByKey, legacyKey } from "../data/index";
import {
  SYMBOL_MODIFIERS,
  STATUSES,
  type CodingScheme,
} from "../legacy/fields";
import type {
  ConversionCandidate,
  ConversionOptions,
  ConversionResult,
  MatchQuality,
  SidcStandard,
} from "../types";
import { DiagnosticList } from "../diagnostics";
import {
  convertToNumeric,
  NUMERIC_TARGETS,
  type NumericTarget,
} from "./numeric";
import { failure, finalize, inputAsString } from "./result";
import { mapFields } from "./field-mapping";
import { validateSidc } from "../validation";

export type NumericSourceStandard =
  "MIL-STD-2525D" | "APP-6D" | "MIL-STD-2525E" | "APP-6E";

export interface ReverseOptions {
  /**
   * Which standard the numeric code is written in. Needed for version 10, which 2525D and
   * APP-6(D) share; otherwise taken from the version digits.
   */
  sourceStandard?: NumericSourceStandard;
  /** 2525C country code to put in positions 13-14 (default "--"). */
  countryCode?: ConversionOptions["countryCode"];
  /** 2525C order of battle for position 15 (default "-", or "X" for tactical graphics). */
  orderOfBattle?: ConversionOptions["orderOfBattle"];
  preferredSource?: ConversionOptions["preferredSource"];
  strictInput?: boolean;
}

/** Version digits -> forward target. 12, 13 and 14 have no catalog to check against. */
function targetFor(
  version: string,
  source: NumericSourceStandard | undefined,
  d: DiagnosticList,
): NumericTarget | null {
  switch (version) {
    case "10":
      if (source === "APP-6D") return NUMERIC_TARGETS["APP-6D"];
      if (source === undefined) {
        d.info(
          "VERSION_10_AS_2525D",
          'Version 10 is used by both MIL-STD-2525D and APP-6(D); read as 2525D. Pass sourceStandard: "APP-6D" for APP-6(D).',
          [1, 2],
        );
      }
      return NUMERIC_TARGETS["2525D"];
    case "11":
      return NUMERIC_TARGETS["2525Dch1"];
    case "15":
      return NUMERIC_TARGETS["2525E"];
    case "16":
      return NUMERIC_TARGETS["APP-6E"];
    case "12":
    case "13":
    case "14":
      d.error(
        "UNSUPPORTED_VERSION",
        `Version ${version} (${version === "12" ? "APP-6(D) Change 2, withdrawn" : version === "13" ? "2525E base" : "APP-6(E) Change 1"}) has no catalog to check codes against.`,
        [1, 2],
      );
      return null;
    default:
      d.error(
        "UNSUPPORTED_VERSION",
        `Unknown version "${version}" in positions 1-2.`,
        [1, 2],
      );
      return null;
  }
}

// ---------------------------------------------------------------------------------------------
// Index: numeric symbol part -> 2525C table entries whose forward conversion produces it.

interface IndexEntry {
  template: string;
  quality: MatchQuality;
}
const indexCache = new Map<string, Map<string, IndexEntry[]>>();

/** Symbol part of a numeric code: symbol set, entity, modifiers and common-modifier flags. */
const symbolPart = (n: string) =>
  n.slice(4, 6) + n.slice(10, 20) + (n.length === 30 ? n.slice(20, 22) : "00");

function concreteBase(template: string): string {
  if (template[0] === "W") return template;
  const c = [...template];
  if (c[1] === "*") c[1] = "F";
  if (c[3] === "*") c[3] = "P";
  for (const i of [10, 11, 12, 13, 14])
    if (c[i] === "*") c[i] = i === 10 && template[10] === "H" ? "H" : "-";
  return c.join("");
}

function indexFor(
  target: NumericTarget,
  preferredSource: ReverseOptions["preferredSource"],
): Map<string, IndexEntry[]> {
  const key = `${target.edition}|${preferredSource ?? ""}`;
  const cached = indexCache.get(key);
  if (cached) return cached;
  const index = new Map<string, IndexEntry[]>();
  const seen = new Set<string>();
  for (const { template } of catalog) {
    const base = concreteBase(template);
    if (seen.has(base)) continue;
    seen.add(base);
    const opts: ConversionOptions = { allowLossy: true, extendedSidc: true };
    if (preferredSource) opts.preferredSource = preferredSource;
    const r = convertToNumeric(base, target, opts);
    // Ambiguous forward results are indexed too, so the reverse direction can say why.
    const outputs =
      r.success && r.output
        ? [r.output]
        : (r.candidates ?? []).map((c) => c.output);
    for (const out of outputs) {
      const part = symbolPart(out);
      const list = index.get(part) ?? [];
      list.push({
        template,
        quality: r.success ? r.matchQuality : "ambiguous",
      });
      index.set(part, list);
    }
  }
  indexCache.set(key, index);
  return index;
}

// ---------------------------------------------------------------------------------------------

const STANDARD_IDENTITY_LETTERS: Record<string, string> = {
  "00": "P",
  "01": "U",
  "02": "A",
  "03": "F",
  "04": "N",
  "05": "S",
  "06": "H",
  "10": "G",
  "11": "W",
  "12": "M",
  "13": "D",
  "14": "L",
  "15": "J",
  "16": "K",
};
const STATUS_LETTERS = ["P", "A", "C", "D", "X", "F"];

const digitsCache = new Map<string, string | null>();
/** Numeric digits 8-10 (HQ/TF/dummy, amplifier) that 2525C positions 11-12 map to. */
function modifierDigits(scheme: CodingScheme, mod: string): string | null {
  const key = scheme + mod;
  let v = digitsCache.get(key);
  if (v === undefined) {
    const f = mapFields(`${scheme}F-P------${mod}---`, new DiagnosticList());
    v = f ? f.hqtfd + f.amplifier : null;
    digitsCache.set(key, v);
  }
  return v;
}

/** Letter SIDCs to try for one table entry, before forward verification. */
function instantiate(template: string, numeric: string): string[] {
  if (template[0] === "W") return [template];
  const scheme = template[0] as Exclude<CodingScheme, "W">;
  const si = STANDARD_IDENTITY_LETTERS[numeric.slice(2, 4)];
  const status = STATUS_LETTERS[Number(numeric[6])];
  if (!si || !status || !(status in STATUSES[scheme])) return [];
  // Country code and order of battle have no numeric field: verify without them, add them after.
  const country = "--";
  const ob = scheme === "G" ? "X" : "-";
  const out: string[] = [];
  const digits = numeric.slice(7, 10);
  for (const mod of Object.keys(SYMBOL_MODIFIERS[scheme])) {
    // Skip modifiers whose HQ/TF/dummy and amplifier digits differ: they cannot convert back.
    if (modifierDigits(scheme, mod) !== digits) continue;
    // Positions 11-12 must fit the table entry (installations carry a fixed H).
    if (template[10] === "H" ? mod[0] !== "H" : mod[0] === "H") continue;
    if (template[11] !== "*" && template[11] !== "-" && template[11] !== mod[1])
      continue;
    out.push(
      `${template[0]}${si}${template[2]}${status}${template.slice(4, 10)}${mod}${country}${ob}`,
    );
  }
  return out;
}

const RANK: MatchQuality[] = [
  "exact",
  "equivalent",
  "lossy",
  "approximate",
  "ambiguous",
  "unsupported",
];

export function convertNumericTo2525C(
  input: unknown,
  options: ReverseOptions = {},
): ConversionResult {
  const d = new DiagnosticList();
  const source: SidcStandard = options.sourceStandard ?? "MIL-STD-2525D";
  const fail = (extra: Partial<ConversionResult> = {}) => ({
    ...failure(input, "MIL-STD-2525C", d, extra),
    sourceStandard: source,
  });
  if (typeof input !== "string") {
    d.error(
      "INVALID_TYPE",
      "Expected the numeric SIDC as a string (never a number: leading zeros matter).",
    );
    return fail();
  }
  let s = input;
  if (s.trim() !== s) {
    if (options.strictInput) {
      d.error(
        "SURROUNDING_WHITESPACE",
        "The SIDC has leading or trailing whitespace.",
      );
      return fail();
    }
    s = s.trim();
    d.warn("WHITESPACE_TRIMMED", "Leading/trailing whitespace was removed.");
  }
  if (!/^\d+$/.test(s) || (s.length !== 20 && s.length !== 30)) {
    d.error(
      "INVALID_NUMERIC_SIDC",
      `A numeric SIDC has 20 or 30 digits; received "${s}".`,
    );
    return fail();
  }
  if (s.length === 30) {
    if (
      !/^[01]{2}$/.test(s.slice(20, 22)) ||
      s[22] !== "0" ||
      !/^0{7}$/.test(s.slice(23))
    ) {
      d.error(
        "UNSUPPORTED_EXTENSION",
        "Only the 30-digit form with common-modifier indicators (positions 21-22), default frame shape (23 = 0) and empty positions 24-30 is supported.",
        [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
      );
      return fail({ normalizedInput: s });
    }
  }
  const target = targetFor(s.slice(0, 2), options.sourceStandard, d);
  if (!target) return fail({ normalizedInput: s });
  if (options.sourceStandard && target.standard !== options.sourceStandard) {
    d.error(
      "VERSION_MISMATCH",
      `Version ${s.slice(0, 2)} is ${target.label}, not ${options.sourceStandard}.`,
      [1, 2],
    );
    return fail({ normalizedInput: s });
  }
  if (!STANDARD_IDENTITY_LETTERS[s.slice(2, 4)]) {
    d.error(
      "UNMAPPED_STANDARD_IDENTITY",
      `Standard identity ${s.slice(2, 4)} has no 2525C letter (simulation context and reserved values have none).`,
      [3, 4],
    );
    return fail({ normalizedInput: s });
  }

  const entries =
    indexFor(target, options.preferredSource).get(symbolPart(s)) ?? [];
  if (entries.length === 0) {
    d.error(
      "NO_MAPPING",
      `No MIL-STD-2525C symbol converts to symbol set ${s.slice(4, 6)}, entity ${s.slice(10, 16)}, modifiers ${s.slice(16, 18)}/${s.slice(18, 20)} in ${target.label}.`,
      [5, 6, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    );
    return fail({ normalizedInput: s });
  }

  // Verify every candidate by converting it forward.
  const accepted = new Map<string, MatchQuality>();
  for (const e of entries) {
    for (const letter of instantiate(e.template, s)) {
      const fo: ConversionOptions = { allowLossy: true, extendedSidc: true };
      if (options.preferredSource) fo.preferredSource = options.preferredSource;
      const f = convertToNumeric(letter, target, fo);
      if (f.success && f.output === s) accepted.set(letter, f.matchQuality);
    }
  }
  if (accepted.size === 0 && entries.every((e) => e.quality === "ambiguous")) {
    d.error(
      "SOURCES_DISAGREE",
      `${entries.map((e) => e.template).join(", ")} converts to this code only for one of the disagreeing mapping sources; pass preferredSource to choose.`,
    );
    return fail({ normalizedInput: s, matchQuality: "ambiguous" });
  }
  if (accepted.size === 0) {
    d.error(
      "NO_MAPPING",
      `The symbol maps to ${entries.map((e) => e.template).join(", ")}, but no 2525C standard identity, status and modifier combination reproduces HQ/TF/dummy ${s[7]} and amplifier ${s.slice(8, 10)}.`,
      [3, 4, 7, 8, 9, 10],
    );
    return fail({ normalizedInput: s });
  }

  // The forward quality of a candidate is the reverse quality, except that a 2525C symbol whose
  // forward mapping is lossy is more specific than the numeric code: choosing it would invent the
  // detail the numeric code does not carry.
  const ranked = [...accepted].sort(
    (a, b) => RANK.indexOf(a[1]) - RANK.indexOf(b[1]),
  );
  const bestQuality = ranked[0]![1];
  const sameRank = ranked.filter(([, q]) => q === bestQuality);
  const candidates: ConversionCandidate[] = ranked.map(([sidc, q]) => ({
    output: sidc,
    matchQuality: q === "lossy" ? "approximate" : q,
    sources: ["forward-verified"],
    note: catalogDescription(sidc),
  }));
  if (bestQuality !== "exact" && bestQuality !== "equivalent") {
    d.error(
      "ONLY_MORE_SPECIFIC_SYMBOLS",
      `Only more specific 2525C symbols convert to this code (${ranked.map(([x]) => x).join(", ")}); picking one would add detail the numeric code does not have.`,
    );
    return fail({ normalizedInput: s, matchQuality: "ambiguous", candidates });
  }
  // The 2525C tables list a few symbols twice under different function IDs (e.g. ENGAGEMENT AREA
  // as GAE and DAE). Those are one symbol; take the first in table order and say so.
  const sameDescription =
    new Set(sameRank.map(([x]) => catalogDescription(x))).size === 1;
  if (sameRank.length > 1 && !sameDescription) {
    d.error(
      "SEVERAL_2525C_SYMBOLS",
      `Several 2525C symbols convert to this code with the same quality: ${sameRank.map(([x]) => `${x} (${catalogDescription(x)})`).join(", ")}.`,
    );
    return fail({ normalizedInput: s, matchQuality: "ambiguous", candidates });
  }
  if (sameRank.length > 1) {
    sameRank.sort((a, b) => catalogOrder(a[0]) - catalogOrder(b[0]));
    ranked.splice(0, sameRank.length, ...sameRank);
    d.info(
      "LISTED_TWICE_IN_2525C",
      `"${catalogDescription(sameRank[0]![0])}" appears more than once in the 2525C tables (${sameRank.map(([x]) => x.slice(4, 10)).join(", ")}); the first listing is used.`,
    );
  }
  if (ranked.length > 1) {
    d.info(
      "MORE_SPECIFIC_ALTERNATIVES",
      `More specific 2525C symbols also convert to this code: ${ranked
        .slice(1)
        .map(([x]) => x)
        .join(", ")}.`,
    );
  }
  const bestSidc = ranked[0]![0];
  let output = bestSidc;
  if (
    output[0] !== "W" &&
    (options.countryCode !== undefined || options.orderOfBattle !== undefined)
  ) {
    const cc = (options.countryCode ?? "--").toUpperCase();
    const ob = (options.orderOfBattle ?? output[14] ?? "-").toUpperCase();
    const withTail = output.slice(0, 12) + cc + ob;
    const v = validateSidc(withTail, { strictInput: true });
    if (!v.valid) {
      for (const e of v.diagnostics.filter((x) => x.severity === "error"))
        d.error("INVALID_FIELD_VALUE", e.message, e.positions);
      return fail({ normalizedInput: s });
    }
    output = withTail;
  }
  const description = catalogDescription(bestSidc);
  return finalize(
    {
      input: inputAsString(input),
      normalizedInput: s,
      output,
      sourceStandard: target.standard,
      targetStandard: "MIL-STD-2525C",
      matchQuality: bestQuality,
      success: true,
      warnings: [],
      errors: [],
      diagnostics: [],
      mappingSource: "forward-verified",
      ...(description
        ? {
            metadata: {
              codingScheme: bestSidc[0] ?? "",
              legacyDescription: description,
            },
          }
        : {}),
    },
    d,
  );
}

function catalogOrder(sidc: string): number {
  return catalog.findIndex((c) => legacyKey(c.template) === legacyKey(sidc));
}

function catalogDescription(sidc: string): string {
  return catalogByKey.get(legacyKey(sidc))?.[0]?.description ?? "";
}
