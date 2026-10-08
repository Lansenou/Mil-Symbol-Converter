/**
 * MIL-STD-2525C (15 characters) -> 20-digit numeric SIDC for MIL-STD-2525D/E and APP-6(D)/(E).
 *
 * Numeric SIDC layout (MIL-STD-2525D Appendix A, Figure A-1):
 *   1-2 version | 3 context | 4 standard identity | 5-6 symbol set | 7 status |
 *   8 HQ/task force/dummy | 9-10 amplifier | 11-16 entity/type/subtype | 17-18 sector 1 modifier |
 *   19-20 sector 2 modifier
 *
 * The SIDC is built as a string and never passes through a number, so leading zeros survive.
 */
import {
  defaultAdapters,
  type MappingAdapter,
  type MappingEvidence,
} from "../adapters/symbology-adapter";
import {
  contested,
  entitiesOf,
  entityName,
  modifierName,
  modifiersOf,
  SYMBOL_SET_NAMES,
  type EditionKey,
} from "../data/index";
import {
  STANDARD_IDENTITIES,
  STATUSES,
  SYMBOL_MODIFIERS,
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
import { mapFields } from "./field-mapping";
import {
  words,
  ancestors,
  bestNameMatch,
  calibratedCertainty,
  nameScore,
  plausibleSymbolSets,
} from "./fuzzy";
import { prepareInput } from "./prepare";
import { failure, finalize, worst, inputAsString } from "./result";

export interface NumericTarget {
  standard: Extract<
    SidcStandard,
    "MIL-STD-2525D" | "MIL-STD-2525E" | "APP-6D" | "APP-6E"
  >;
  /** Version digits 1-2. */
  version: string;
  /** Catalog used to check that the code exists with the same meaning. */
  edition: EditionKey;
  label: string;
}

/**
 * Version digits per target, as defined by MIL-STD-2525D Table A-I (10) and the version
 * constants of mil-sym-ts SymbolID (10 APP-6D, 11 2525D Change 1, 15 2525E Change 1,
 * 16 APP-6E Change 2), which are also the version tags of its catalogs.
 */
export const NUMERIC_TARGETS = {
  "2525D": {
    standard: "MIL-STD-2525D",
    version: "10",
    edition: "2525D",
    label: "MIL-STD-2525D (version 10)",
  },
  "2525Dch1": {
    standard: "MIL-STD-2525D",
    version: "11",
    edition: "2525Dch1",
    label: "MIL-STD-2525D Change 1 (version 11)",
  },
  "APP-6D": {
    standard: "APP-6D",
    version: "10",
    edition: "APP-6D",
    label: "APP-6(D) (version 10)",
  },
  "2525E": {
    standard: "MIL-STD-2525E",
    version: "15",
    edition: "2525Ech1",
    label: "MIL-STD-2525E Change 1 (version 15)",
  },
  "APP-6E": {
    standard: "APP-6E",
    version: "16",
    edition: "APP-6Ech2",
    label: "APP-6(E) Change 2 (version 16)",
  },
} as const satisfies Record<string, NumericTarget>;

const NUMERIC_SIDC = /^(\d{20}|\d{30})$/;

/** Positions a numeric target needs concrete values for. */
function requiredPositions(scheme: CodingScheme): number[] {
  if (scheme === "W") return [];
  if (scheme === "I") return [2, 4];
  return [2, 4, 11, 12];
}

const normalizeName = (n: string) =>
  n
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "");

const STOPWORDS = new Set(["and", "or", "of", "the", "a", "an", "with", "for"]);
/** Words of the most specific name segment, singularized ("Vehicles" -> "vehicle"). */
const leafWords = (n: string) =>
  new Set(
    (n.split(":").pop() ?? "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w && !STOPWORDS.has(w))
      .map((w) =>
        w.length > 3 && w.endsWith("s") && !w.endsWith("ss")
          ? w.slice(0, -1)
          : w,
      ),
  );

/**
 * Compares the names two catalogs give the same code.
 * - "same": identical apart from case and punctuation.
 * - "renamed": the most specific segment shares its wording (one word set contains the other,
 *   or they overlap by at least half), e.g. "VSTOL" vs "Vertical or Short Take-off and
 *   Landing (VSTOL)", "Utility Vehicle" vs "Utility Vehicles". Parent segments are ignored
 *   because catalogs regroup entities ("Military/Civilian" vs "Installation").
 * - "different": anything else, e.g. "Antisubmarine Warfare" vs "Palletized Load System".
 */
export function compareNames(
  a: string,
  b: string,
): "same" | "renamed" | "different" {
  if (normalizeName(a) === normalizeName(b)) return "same";
  const x = leafWords(a);
  const y = leafWords(b);
  if (x.size === 0 || y.size === 0) return "different";
  const common = [...x].filter((w) => y.has(w)).length;
  if (common === x.size || common === y.size) return "renamed";
  return common / new Set([...x, ...y]).size >= 0.5 ? "renamed" : "different";
}

interface CheckedCandidate {
  evidence: MappingEvidence;
  code: string; // symbol set + entity + m1 + m2 (12 digits)
  valid: boolean;
  native: boolean;
  contested: boolean;
  reason: string;
  entityName?: string | undefined;
  modifierNames: string[];
  /** Name differences judged to be wording changes rather than different meanings. */
  renamed?: string[];
  /** Parts found under a different code (same name) in the target edition. */
  renumbered?: string[];
}

/** Checks that a candidate exists in the target edition with the meaning its source gave it. */
function checkCandidate(
  e: MappingEvidence,
  target: NumericTarget,
  allowExtended = false,
): CheckedCandidate {
  const code = `${e.symbolSet}${e.entity}${e.m1}${e.m2}`;
  const base: CheckedCandidate = {
    evidence: e,
    code,
    valid: false,
    native: false,
    contested: false,
    reason: "",
    modifierNames: [],
  };
  if (e.retired)
    return {
      ...base,
      reason: `${e.source} marks this 2525C symbol as retired (no 2525D counterpart)`,
    };
  const modOk = (m: string) => /^(\d{2}|1\d{2})$/.test(m);
  if (!/^\d{8}$/.test(e.symbolSet + e.entity) || !modOk(e.m1) || !modOk(e.m2)) {
    return {
      ...base,
      reason: `${e.source} maps to ${e.symbolSet}/${e.entity}/${e.m1}/${e.m2}, which needs the extended (30-digit) SIDC`,
    };
  }
  // Resolve each part in the target edition. A code that is missing there, or names something
  // else there, may have been renumbered: the target entry with the identical name is used,
  // provided it is unique (see renumberEntity / renumberModifier).
  const renamed: string[] = [];
  const renumbered: string[] = [];
  const entitySource = entityName(e.nativeEdition, e.symbolSet, e.entity);
  if (entitySource === undefined) {
    return {
      ...base,
      reason: `entity ${e.entity} of symbol set ${e.symbolSet} is not in the ${e.source} source catalog`,
    };
  }
  let entity = e.entity;
  let entityTarget = entityName(target.edition, e.symbolSet, entity);
  if (
    entityTarget === undefined ||
    compareNames(entitySource, entityTarget) === "different"
  ) {
    const moved = renumberEntity(target.edition, e.symbolSet, entitySource);
    if (!moved) {
      return {
        ...base,
        reason:
          entityTarget === undefined
            ? `entity ${e.entity} of symbol set ${e.symbolSet} is not in the ${target.label} catalog`
            : `entity ${e.entity} means "${entitySource}" for ${e.source} but "${entityTarget}" in ${target.label}`,
      };
    }
    renumbered.push(`entity "${entitySource}" ${e.entity} -> ${moved[0]}`);
    [entity, entityTarget] = moved;
  } else if (compareNames(entitySource, entityTarget) === "renamed") {
    renamed.push(`entity ${e.entity}: "${entitySource}" / "${entityTarget}"`);
  }

  const slots: Record<1 | 2, string> = { 1: "00", 2: "00" };
  const modNames: string[] = [];
  for (const [sector, code] of [
    [1, e.m1],
    [2, e.m2],
  ] as const) {
    if (code === "00") continue;
    const what = `sector ${sector} modifier ${code}`;
    // 3-digit codes are 2525E common modifiers (catalog symbol set "00").
    const setOf = (c: string) => (c.length === 3 ? "00" : e.symbolSet);
    const sourceName = modifierName(e.nativeEdition, setOf(code), sector, code);
    if (sourceName === undefined) {
      return {
        ...base,
        reason: `${what} of symbol set ${e.symbolSet} is not in the ${e.source} source catalog`,
      };
    }
    const targetName = modifierName(target.edition, setOf(code), sector, code);
    let placed: [1 | 2, string, string] | undefined;
    if (
      targetName !== undefined &&
      compareNames(sourceName, targetName) !== "different"
    ) {
      placed = [sector, code, targetName];
      if (compareNames(sourceName, targetName) === "renamed") {
        renamed.push(`${what}: "${sourceName}" / "${targetName}"`);
      }
    } else {
      placed = renumberModifier(target.edition, e.symbolSet, sourceName);
      if (!placed) {
        return {
          ...base,
          reason:
            targetName === undefined
              ? `${what} of symbol set ${e.symbolSet} is not in the ${target.label} catalog`
              : `${what} means "${sourceName}" for ${e.source} but "${targetName}" in ${target.label}`,
        };
      }
      renumbered.push(
        `modifier "${sourceName}" sector ${sector} ${code} -> sector ${placed[0]} ${placed[1]}`,
      );
    }
    if (slots[placed[0]] !== "00") {
      return {
        ...base,
        reason: `both modifiers need sector ${placed[0]} in ${target.label}`,
      };
    }
    slots[placed[0]] = placed[1];
    modNames.push(placed[2]);
  }
  // Common modifiers (3 digits) put their indicator in SIDC positions 21-22 of the 30-digit form.
  const commonFlags = `${slots[1].length === 3 ? slots[1][0] : "0"}${slots[2].length === 3 ? slots[2][0] : "0"}`;
  const finalCode =
    `${e.symbolSet}${entity}${slots[1].slice(-2)}${slots[2].slice(-2)}` +
    (commonFlags === "00" ? "" : `+${commonFlags}`);
  if (finalCode.includes("+") && !allowExtended) {
    return {
      ...base,
      reason: `${target.label} expresses ${modNames.join(", ")} as a common modifier, which needs the 30-digit SIDC (pass extendedSidc: true)`,
    };
  }

  const isContested = contested.some(
    (c) =>
      c.editions.includes(target.edition) &&
      c.symbolSet === e.symbolSet &&
      ((c.kind === "entity" && c.code === entity) ||
        (c.kind === "modifier1" && c.code === slots[1]) ||
        (c.kind === "modifier2" && c.code === slots[2])),
  );
  return {
    ...base,
    code: finalCode,
    valid: true,
    native: e.nativeEdition === target.edition && renumbered.length === 0,
    contested: isContested,
    reason: "",
    renamed,
    renumbered,
    entityName: entityTarget,
    modifierNames: modNames,
  };
}

/**
 * The unique target entity with the same name: identical apart from case/punctuation, or with an
 * identical most-specific segment whose parent segments are not different in meaning.
 */
function renumberEntity(
  edition: EditionKey,
  symbolSet: string,
  sourceName: string,
): [string, string] | undefined {
  const segs = (n: string) => n.split(":").map((x) => x.trim());
  const sameWords = (a: string, b: string) => {
    const x = words(a);
    const y = words(b);
    return x.size === y.size && [...x].every((w) => y.has(w));
  };
  const src = segs(sourceName);
  // Identical apart from case/punctuation, or the same last two segments word for word
  // (plurals and punctuation aside): "Utility Vehicle : Bus" = "Utility Vehicles : Bus", but
  // "Tank Recovery Vehicle : Heavy" is not "Tank : Heavy".
  const hits = entitiesOf(edition, symbolSet).filter(([, n]) => {
    if (compareNames(sourceName, n) === "same") return true;
    const tgt = segs(n);
    if (src.length !== tgt.length) return false;
    const k = Math.min(2, src.length);
    return src
      .slice(-k)
      .every((seg, i) => sameWords(seg, tgt[tgt.length - k + i] ?? ""));
  });
  return hits.length === 1 ? hits[0] : undefined;
}

/** The unique target modifier (either sector) whose name is identical apart from case/punctuation. */
function renumberModifier(
  edition: EditionKey,
  symbolSet: string,
  sourceName: string,
): [1 | 2, string, string] | undefined {
  const same = ([, , n]: [1 | 2, string, string]) =>
    normalizeName(n) === normalizeName(sourceName);
  const hits = modifiersOf(edition, symbolSet).filter(same);
  if (hits.length === 1) return hits[0];
  if (hits.length > 1) return undefined;
  // 2525E moved many set-specific modifiers to the common modifiers (catalog set "00").
  const common = modifiersOf(edition, "00").filter(same);
  return common.length === 1 ? common[0] : undefined;
}

export function convertToNumeric(
  input: unknown,
  target: NumericTarget,
  options: ConversionOptions = {},
  adapters: readonly MappingAdapter[] = defaultAdapters,
): ConversionResult {
  const strict = convertStrict(input, target, options, adapters);
  if (strict.success || !options.fuzzy) return strict;
  return fuzzyFallback(strict, target, options, adapters) ?? strict;
}

const FUZZY_ELIGIBLE = new Set([
  "NO_MAPPING",
  "NO_VALID_MAPPING",
  "SOURCES_DISAGREE",
  "SOURCES_DISAGREE_ON_MEANING",
]);

/** Approximate matching for strict failures caused by missing or conflicting mappings only. */
function fuzzyFallback(
  strict: ConversionResult,
  target: NumericTarget,
  options: ConversionOptions,
  adapters: readonly MappingAdapter[],
): ConversionResult | undefined {
  const sidc = strict.normalizedInput;
  const errors = strict.diagnostics.filter((x) => x.severity === "error");
  if (
    !sidc ||
    errors.length === 0 ||
    !errors.every((x) => FUZZY_ELIGIBLE.has(x.code))
  )
    return undefined;
  const description = strict.metadata?.legacyDescription;
  const minCertainty = options.minCertainty ?? 0.7;
  const d = new DiagnosticList();
  // Keep the strict diagnostics as context, demoted to info.
  for (const x of strict.diagnostics)
    d.add("info", x.code, x.message, x.positions);

  const finish = (
    output: string,
    quality: MatchQuality,
    fuzzy: NonNullable<ConversionResult["fuzzy"]>,
  ) => {
    d.warn(
      "FUZZY_RESULT",
      `Approximate result (${fuzzy.method}, certainty ${fuzzy.certainty.toFixed(2)}): ${fuzzy.basis}.`,
    );
    const lossyBlocked = quality === "lossy" && !options.allowLossy;
    if (lossyBlocked)
      d.error(
        "LOSSY_NOT_ALLOWED",
        "The approximate result is broader than the input; pass allowLossy: true to accept it.",
      );
    return finalize(
      {
        ...strict,
        output: lossyBlocked ? null : output,
        matchQuality: quality,
        success: !lossyBlocked,
        mappingSource: `fuzzy:${fuzzy.method}`,
        confidence: "single-source",
        fuzzy,
        warnings: [],
        errors: [],
        diagnostics: [],
        ...(lossyBlocked
          ? {
              candidates: [
                {
                  output,
                  matchQuality: quality,
                  sources: [fuzzy.method],
                  note: fuzzy.basis,
                },
              ],
            }
          : {}),
      },
      d,
    );
  };

  // 1. Sources disagree: pick the candidate whose target name best matches the 2525C description.
  if (description && strict.candidates && strict.candidates.length > 1) {
    const scored = strict.candidates
      .map((c) => ({ c, score: nameScore(description, c.note) }))
      .sort((a, b) => b.score - a.score);
    const [best, second] = scored;
    if (best) {
      const certainty = calibratedCertainty(
        best.score,
        best.score - (second?.score ?? 0),
      );
      if (certainty >= minCertainty) {
        return finish(best.c.output, "approximate", {
          method: "source-choice",
          certainty,
          basis: `"${description}" matches "${best.c.note}" (${best.c.sources.join("+")}) better than the alternative`,
        });
      }
    }
  }

  // 2. Search the target catalog by the 2525C description.
  const fieldDigits = mapFields(sidc, new DiagnosticList());
  if (description && fieldDigits && sidc[0] !== "W") {
    const sets = plausibleSymbolSets(sidc);
    for (const e of adapters.flatMap((a) => a.lookup(sidc)))
      sets.add(e.symbolSet);
    const m = bestNameMatch(target.edition, sets, description);
    if (m) {
      const certainty = calibratedCertainty(m.score, m.margin);
      if (certainty >= minCertainty) {
        const output =
          target.version +
          fieldDigits.standardIdentity +
          m.symbolSet +
          fieldDigits.status +
          fieldDigits.hqtfd +
          fieldDigits.amplifier +
          m.entity +
          "0000";
        return finish(output, "approximate", {
          method: "name-match",
          certainty,
          basis: `"${description}" ~ "${m.name}" (${SYMBOL_SET_NAMES[m.symbolSet] ?? m.symbolSet} ${m.entity}), similarity ${m.score.toFixed(2)}`,
        });
      }
    }
  }

  // 3. Nearest 2525C ancestor with a strict mapping: a documented, broader symbol.
  for (const [a, levels, aDescription] of ancestors(sidc)) {
    const r = convertStrict(
      a,
      target,
      { ...options, allowLossy: true },
      adapters,
    );
    if (
      r.success &&
      r.output &&
      (r.matchQuality === "exact" || r.matchQuality === "equivalent")
    ) {
      return finish(r.output, "lossy", {
        method: "ancestor",
        certainty: 1,
        basis: `no mapping for "${description ?? sidc}"; using its 2525C parent ${levels > 1 ? `(${levels} levels up) ` : ""}"${aDescription}" (${a}), which loses the specialisation`,
      });
    }
  }
  return undefined;
}

function convertStrict(
  input: unknown,
  target: NumericTarget,
  options: ConversionOptions,
  adapters: readonly MappingAdapter[],
): ConversionResult {
  const d = new DiagnosticList();
  const prepared = prepareInput(input, options, target.standard, false, d);
  if (!prepared.ok || prepared.sidc === null) {
    return failure(input, target.standard, d, {
      normalizedInput: prepared.validation.normalized,
    });
  }
  const sidc = prepared.sidc;
  const scheme = sidc[0] as CodingScheme;
  const entry = prepared.validation.catalogEntry;
  const metadata: NonNullable<ConversionResult["metadata"]> = {
    codingScheme: scheme,
    version: target.version,
  };
  if (entry) {
    metadata.legacyDescription = entry.description;
    metadata.legacyHierarchy = entry.hierarchy;
  }

  // --- Wildcards the numeric code cannot carry
  const missing = requiredPositions(scheme).filter((p) => sidc[p - 1] === "*");
  if (missing.length > 0) {
    const hints: string[] = [];
    if (missing.includes(2))
      hints.push(
        `affiliation (one of ${Object.keys(STANDARD_IDENTITIES).join("")})`,
      );
    if (missing.includes(4) && scheme !== "W")
      hints.push(`status (one of ${Object.keys(STATUSES[scheme]).join("")})`);
    if (missing.includes(11) || missing.includes(12)) {
      const n = Object.keys(
        SYMBOL_MODIFIERS[scheme as Exclude<CodingScheme, "W">] ?? {},
      ).length;
      hints.push(`symbolModifier (${n} table values, e.g. "--" for none)`);
    }
    d.error(
      "UNRESOLVED_WILDCARD",
      `The numeric SIDC needs concrete values at position(s) ${missing.join(", ")}; a "*" there stands for several different symbols. Supply ${hints.join(", ")}.`,
      missing,
    );
    return failure(input, target.standard, d, {
      normalizedInput: sidc,
      matchQuality: "ambiguous",
      ambiguousPositions: missing,
      metadata,
    });
  }
  const tailWildcards = [13, 14, 15].filter((p) => sidc[p - 1] === "*");
  if (tailWildcards.length > 0) {
    d.warn(
      "WILDCARD_NOT_CARRIED",
      `Position(s) ${tailWildcards.join(", ")} remain "*"; the numeric SIDC has no country code or order of battle, so any value there would be dropped.`,
      tailWildcards,
    );
  }

  // --- Field digits
  const fieldDigits = mapFields(sidc, d);

  // --- Entity evidence
  const evidence = adapters.flatMap((a) => a.lookup(sidc));
  if (evidence.length === 0) {
    d.error(
      "NO_MAPPING",
      `Neither ${adapters.map((a) => a.name).join(" nor ")} maps ${entry ? `"${entry.description}" (${entry.template})` : sidc} to a numeric symbol.`,
      [5, 6, 7, 8, 9, 10],
    );
    return failure(input, target.standard, d, {
      normalizedInput: sidc,
      metadata,
    });
  }
  const checked = evidence.map((e) =>
    checkCandidate(e, target, options.extendedSidc === true),
  );
  const valid = checked.filter((c) => c.valid);
  const retiredBy = checked
    .filter((c) => c.evidence.retired)
    .map((c) => c.evidence.source);
  for (const c of checked.filter((x) => !x.valid)) {
    d.info("CANDIDATE_REJECTED", `Not used for ${target.label}: ${c.reason}.`);
  }

  // 20 digits, or 30 when a 2525E common modifier is used: positions 21-22 common-modifier
  // indicators, 23 frame shape (0 = default for the symbol set), 24-30 zero (mil-sym-ts SymbolID).
  const compose = (c: CheckedCandidate) => {
    if (!fieldDigits) return null;
    const [code12 = "", flags] = c.code.split("+");
    const base20 =
      target.version +
      fieldDigits.standardIdentity +
      code12.slice(0, 2) +
      fieldDigits.status +
      fieldDigits.hqtfd +
      fieldDigits.amplifier +
      code12.slice(2);
    return flags ? `${base20}${flags}00000000` : base20;
  };

  // Group valid candidates by code.
  const byCode = new Map<string, CheckedCandidate[]>();
  for (const c of valid) byCode.set(c.code, [...(byCode.get(c.code) ?? []), c]);

  const candidateList = (quality: MatchQuality): ConversionCandidate[] =>
    [...byCode.values()].flatMap((cs) => {
      const out = compose(cs[0]!);
      return out
        ? [
            {
              output: out,
              matchQuality: quality,
              sources: cs.map((c) => c.evidence.source),
              note: `${cs[0]!.entityName ?? ""}${cs[0]!.modifierNames.length ? ` (${cs[0]!.modifierNames.join(", ")})` : ""}`,
            },
          ]
        : [];
    });

  if (byCode.size === 0) {
    d.error(
      "NO_VALID_MAPPING",
      `No source provides a code with the same meaning for ${target.label}: ${[...new Set(checked.map((c) => c.reason))].join("; ")}.`,
    );
    return failure(input, target.standard, d, {
      normalizedInput: sidc,
      metadata,
    });
  }

  let chosen: CheckedCandidate[];
  if (byCode.size > 1) {
    const preferred = options.preferredSource
      ? [...byCode.values()].find((cs) =>
          cs.some((c) => c.evidence.source === options.preferredSource),
        )
      : undefined;
    if (!preferred) {
      d.error(
        "SOURCES_DISAGREE",
        `The mapping sources give different ${target.label} codes (${[
          ...byCode.values(),
        ]
          .map(
            (cs) =>
              `${cs.map((c) => c.evidence.source).join("+")}: ${cs[0]!.code}`,
          )
          .join(" vs ")}). Set preferredSource to choose one explicitly.`,
      );
      return failure(input, target.standard, d, {
        normalizedInput: sidc,
        matchQuality: "ambiguous",
        candidates: candidateList("ambiguous"),
        metadata,
      });
    }
    d.warn(
      "PREFERRED_SOURCE_USED",
      `The mapping sources disagree; using ${options.preferredSource} as requested by preferredSource.`,
    );
    chosen = preferred;
  } else {
    chosen = [...byCode.values()][0]!;
  }

  const lead = chosen[0]!;
  const sources = [...new Set(chosen.map((c) => c.evidence.source))];
  const corroborated = sources.length > 1 && byCode.size === 1;

  // The same digits proposed by another source with a different meaning: one source is using a
  // code whose meaning changed between editions, so the digits alone cannot be trusted.
  const meaningClash = checked.find(
    (c) =>
      !c.valid &&
      !c.evidence.retired &&
      c.code === lead.code &&
      c.reason.includes(" means "),
  );
  const preferredChosen =
    options.preferredSource !== undefined &&
    chosen.some((c) => c.evidence.source === options.preferredSource);
  if (meaningClash && preferredChosen) {
    d.warn(
      "PREFERRED_SOURCE_USED",
      `${meaningClash.evidence.source} gives code ${lead.code} a different meaning (${meaningClash.reason}); using ${options.preferredSource} as requested by preferredSource.`,
    );
  } else if (meaningClash) {
    d.error(
      "SOURCES_DISAGREE_ON_MEANING",
      `${meaningClash.evidence.source} proposes the same code ${lead.code}, but ${meaningClash.reason}; the code's meaning differs between editions, so no output is chosen. Set preferredSource to choose explicitly.`,
    );
    return failure(input, target.standard, d, {
      normalizedInput: sidc,
      matchQuality: "ambiguous",
      candidates: candidateList("ambiguous"),
      metadata,
    });
  }

  if (chosen.some((c) => c.contested)) {
    d.error(
      "CONTESTED_CODE",
      `Implementations disagree about the meaning of part of ${lead.code} in ${target.label} (see src/data/contested-codes.json); no output is chosen.`,
    );
    return failure(input, target.standard, d, {
      normalizedInput: sidc,
      matchQuality: "ambiguous",
      candidates: candidateList("ambiguous"),
      metadata,
    });
  }

  for (const r of new Set(chosen.flatMap((c) => c.renamed ?? []))) {
    d.info(
      "NAME_WORDING_DIFFERS",
      `Catalog wording differs but describes the same item: ${r}.`,
    );
  }

  for (const r of new Set(chosen.flatMap((c) => c.renumbered ?? []))) {
    d.warn(
      "RENUMBERED",
      `Found under a different code with the same name in ${target.label}: ${r}.`,
    );
  }

  // --- Match quality
  let quality: MatchQuality = chosen.some((c) => c.native)
    ? "exact"
    : "equivalent";
  if (!chosen.some((c) => c.native)) {
    d.info(
      "EQUIVALENT_BY_CATALOG",
      `No mapping table written for ${target.label} was available; the code was checked by name in the ${target.label} catalog.`,
    );
  }
  if (retiredBy.length > 0) {
    quality = worst(quality, "lossy");
    d.warn(
      "RETIRED_IN_SOURCE",
      `${retiredBy.join(", ")} marks this 2525C symbol as retired; ${sources.join(", ")} maps it to ${lead.entityName ?? lead.code}, which is the closest documented symbol rather than the same one.`,
    );
  }
  const merged = chosen.find(
    (c) => c.evidence.fanIn > 1 && !c.evidence.canonical,
  );
  if (merged) {
    quality = worst(quality, "lossy");
    d.warn(
      "DISTINCTION_MERGED",
      `${merged.evidence.source} maps ${merged.evidence.fanIn} different 2525C symbols to this code; the distinction made by ${entry?.description ?? sidc} is not represented.`,
      [5, 6, 7, 8, 9, 10],
    );
  }
  if (!corroborated) {
    d.warn(
      "SINGLE_SOURCE",
      `Only ${sources.join(", ")} supports this mapping${
        byCode.size > 1 ? " (chosen with preferredSource)" : ""
      }; it is not corroborated by a second dataset.`,
    );
  }

  // --- Dropped fields
  const dropped: Record<string, string> = {};
  if (scheme !== "W") {
    const cc = sidc.slice(12, 14);
    if (/^[A-Z]{2}$/.test(cc)) dropped.countryCode = cc;
    const ob = sidc[14] ?? "-";
    if (ob !== "-" && ob !== "*" && !(scheme === "G" && ob === "X"))
      dropped.orderOfBattle = ob;
  }
  if (Object.keys(dropped).length > 0) {
    quality = worst(quality, "lossy");
    metadata.droppedFields = dropped;
    d.warn(
      "FIELDS_DROPPED",
      `The 20-digit SIDC has no field for ${Object.entries(dropped)
        .map(([k, v]) => `${k} "${v}"`)
        .join(
          " and ",
        )}; carry it in a text amplifier (e.g. 2525D amplifier AS, country) instead.`,
      [13, 14, 15].filter((p) =>
        p < 15 ? dropped.countryCode : dropped.orderOfBattle,
      ),
    );
  }

  if (!fieldDigits) {
    return failure(input, target.standard, d, {
      normalizedInput: sidc,
      metadata,
    });
  }
  quality = worst(quality, fieldDigits.quality);
  const output = compose(lead);
  if (output === null || !NUMERIC_SIDC.test(output)) {
    d.error(
      "INTERNAL_INVALID_OUTPUT",
      `Internal error: composed SIDC "${output}" is not 20 or 30 digits.`,
    );
    return failure(input, target.standard, d, {
      normalizedInput: sidc,
      metadata,
    });
  }

  metadata.symbolSet = lead.code.slice(0, 2);
  const ssName = SYMBOL_SET_NAMES[metadata.symbolSet];
  if (ssName) metadata.symbolSetName = ssName;
  metadata.entityCode = lead.code.slice(2, 8);
  if (lead.entityName) metadata.entity = lead.entityName;
  metadata.modifiers = lead.modifierNames;
  if (scheme !== "W") {
    const aff = STANDARD_IDENTITIES[sidc[1] ?? ""];
    const st = STATUSES[scheme][sidc[3] ?? ""];
    if (aff) metadata.affiliation = aff;
    if (st) metadata.status = st;
  }

  const lossyBlocked = quality === "lossy" && !options.allowLossy;
  if (lossyBlocked) {
    d.error(
      "LOSSY_NOT_ALLOWED",
      "The conversion loses information (see warnings); pass allowLossy: true to accept it.",
    );
  }
  return finalize(
    {
      input: inputAsString(input),
      normalizedInput: sidc,
      output: lossyBlocked ? null : output,
      sourceStandard: "MIL-STD-2525C",
      targetStandard: target.standard,
      matchQuality: quality,
      success: !lossyBlocked,
      warnings: [],
      errors: [],
      diagnostics: [],
      mappingSource: sources.join(" + "),
      confidence: corroborated ? "corroborated" : "single-source",
      ...(lossyBlocked
        ? {
            candidates: [
              {
                output,
                matchQuality: "lossy" as const,
                sources,
                note: "Rejected because allowLossy is false.",
              },
            ],
          }
        : {}),
      metadata,
    },
    d,
  );
}
