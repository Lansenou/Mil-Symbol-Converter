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
  entityName,
  modifierName,
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
import { prepareInput } from "./prepare";
import { failure, finalize, worst } from "./result";

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

const NUMERIC_SIDC = /^\d{20}$/;

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
}

/** Checks that a candidate exists in the target edition with the meaning its source gave it. */
function checkCandidate(
  e: MappingEvidence,
  target: NumericTarget,
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
  if (!/^\d{12}$/.test(code)) {
    return {
      ...base,
      reason: `${e.source} maps to ${e.symbolSet}/${e.entity}/${e.m1}/${e.m2}, which needs the extended (30-digit) SIDC`,
    };
  }
  const parts: [string, string | undefined, string | undefined][] = [
    [
      `entity ${e.entity}`,
      entityName(e.nativeEdition, e.symbolSet, e.entity),
      entityName(target.edition, e.symbolSet, e.entity),
    ],
    [
      `sector 1 modifier ${e.m1}`,
      modifierName(e.nativeEdition, e.symbolSet, 1, e.m1),
      modifierName(target.edition, e.symbolSet, 1, e.m1),
    ],
    [
      `sector 2 modifier ${e.m2}`,
      modifierName(e.nativeEdition, e.symbolSet, 2, e.m2),
      modifierName(target.edition, e.symbolSet, 2, e.m2),
    ],
  ];
  const renamed: string[] = [];
  for (const [what, sourceName, targetName] of parts) {
    if (targetName === undefined) {
      return {
        ...base,
        reason: `${what} of symbol set ${e.symbolSet} is not in the ${target.label} catalog`,
      };
    }
    if (sourceName === undefined) {
      return {
        ...base,
        reason: `${what} of symbol set ${e.symbolSet} is not in the ${e.source} source catalog`,
      };
    }
    const cmp = compareNames(sourceName, targetName);
    if (cmp === "renamed")
      renamed.push(`${what}: "${sourceName}" / "${targetName}"`);
    if (cmp === "different") {
      return {
        ...base,
        reason: `${what} means "${sourceName}" for ${e.source} but "${targetName}" in ${target.label}`,
      };
    }
  }
  const isContested = contested.some(
    (c) =>
      c.editions.includes(target.edition) &&
      c.symbolSet === e.symbolSet &&
      ((c.kind === "entity" && c.code === e.entity) ||
        (c.kind === "modifier1" && c.code === e.m1) ||
        (c.kind === "modifier2" && c.code === e.m2)),
  );
  return {
    ...base,
    valid: true,
    native: e.nativeEdition === target.edition,
    contested: isContested,
    reason: "",
    renamed,
    entityName: parts[0]?.[2],
    modifierNames: [parts[1]?.[2], parts[2]?.[2]].filter(
      (n): n is string => !!n && n !== "Unspecified",
    ),
  };
}

export function convertToNumeric(
  input: unknown,
  target: NumericTarget,
  options: ConversionOptions = {},
  adapters: readonly MappingAdapter[] = defaultAdapters,
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
  const checked = evidence.map((e) => checkCandidate(e, target));
  const valid = checked.filter((c) => c.valid);
  const retiredBy = checked
    .filter((c) => c.evidence.retired)
    .map((c) => c.evidence.source);
  for (const c of checked.filter((x) => !x.valid)) {
    d.info("CANDIDATE_REJECTED", `Not used for ${target.label}: ${c.reason}.`);
  }

  const compose = (c: CheckedCandidate) =>
    fieldDigits
      ? target.version +
        fieldDigits.standardIdentity +
        c.code.slice(0, 2) +
        fieldDigits.status +
        fieldDigits.hqtfd +
        fieldDigits.amplifier +
        c.code.slice(2)
      : null;

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
      `No source provides a ${target.label} code with the same meaning: ${checked.map((c) => c.reason).join("; ")}.`,
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
      `Internal error: composed SIDC "${output}" is not 20 digits.`,
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
      input: typeof input === "string" ? input : String(input),
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
