/**
 * Field-by-field description of a MIL-STD-2525C SIDC or template, plus the raw mapping
 * evidence each source holds for it. Nothing is converted or resolved here.
 */
import { defaultAdapters, type MappingAdapter, type MappingEvidence } from "./adapters/symbology-adapter";
import {
  CODING_SCHEMES,
  DIMENSIONS,
  METOC,
  ORDERS_OF_BATTLE,
  STANDARD_IDENTITIES,
  STATUSES,
  SYMBOL_MODIFIERS,
  type CodingScheme,
} from "./legacy/fields";
import type { ConversionOptions, ValidationResult } from "./types";
import { validateSidc } from "./validation";
import { wildcardFields, WILDCARD_FIELDS } from "./wildcard";

export interface AnalyzedField {
  name: string;
  positions: number[];
  value: string;
  meaning: string | null;
  wildcard: boolean;
  /** Number of values a wildcard in this field can take (per the 2525C tables), if known. */
  alternatives?: number;
}

export interface SidcAnalysis {
  validation: ValidationResult;
  fields: AnalyzedField[];
  isTemplate: boolean;
  /** Wildcard fields and the option that resolves each. */
  wildcards: { field: string; positions: number[]; option: string; alternatives?: number }[];
  /** Raw evidence per mapping source (independent of any target edition). */
  evidence: MappingEvidence[];
}

const look = (table: Record<string, string> | undefined, v: string) => (table && v in table ? table[v]! : null);

export function analyzeSidc(
  input: unknown,
  options: ConversionOptions = {},
  adapters: readonly MappingAdapter[] = defaultAdapters,
): SidcAnalysis {
  const validation = validateSidc(input, options);
  const sidc = validation.normalized;
  if (!sidc) return { validation, fields: [], isTemplate: false, wildcards: [], evidence: [] };
  const scheme = sidc[0] as CodingScheme;
  const f = (name: string, from: number, to: number, meaning: string | null, alternatives?: number): AnalyzedField => {
    const value = sidc.slice(from - 1, to);
    const wildcard = value.includes("*");
    const out: AnalyzedField = {
      name,
      positions: Array.from({ length: to - from + 1 }, (_, i) => from + i),
      value,
      meaning: wildcard ? null : meaning,
      wildcard,
    };
    if (wildcard && alternatives !== undefined) out.alternatives = alternatives;
    return out;
  };

  let fields: AnalyzedField[];
  if (scheme === "W") {
    fields = [
      f("coding scheme", 1, 1, CODING_SCHEMES.W),
      f("category", 2, 2, look(METOC.categories, sidc.slice(1, 2))),
      f("static/dynamic", 3, 4, look(METOC.staticDynamic, sidc.slice(2, 4))),
      f("function ID", 5, 10, validation.catalogEntry?.description ?? null),
      f("graphic type", 11, 13, look(METOC.graphicTypes, sidc.slice(10, 13))),
      f("not used", 14, 15, null),
    ];
  } else if (scheme in DIMENSIONS) {
    const s = scheme as Exclude<CodingScheme, "W">;
    fields = [
      f("coding scheme", 1, 1, CODING_SCHEMES[s]),
      f("standard identity", 2, 2, look(STANDARD_IDENTITIES, sidc.slice(1, 2)), Object.keys(STANDARD_IDENTITIES).length),
      f("battle dimension / category", 3, 3, look(DIMENSIONS[s], sidc.slice(2, 3))),
      f("status", 4, 4, look(STATUSES[s], sidc.slice(3, 4)), Object.keys(STATUSES[s]).length),
      f("function ID", 5, 10, validation.catalogEntry?.description ?? null),
      f("symbol modifier", 11, 12, look(SYMBOL_MODIFIERS[s], sidc.slice(10, 12)), Object.keys(SYMBOL_MODIFIERS[s]).length),
      f("country code", 13, 14, /^[A-Z]{2}$/.test(sidc.slice(12, 14)) ? `ISO 3166-1 ${sidc.slice(12, 14)}` : sidc.slice(12, 14) === "--" ? "None" : null),
      f("order of battle", 15, 15, look(ORDERS_OF_BATTLE[s], sidc.slice(14, 15)) ?? (sidc[14] === "-" ? "None" : null), Object.keys(ORDERS_OF_BATTLE[s]).length + 1),
    ];
  } else {
    fields = [];
  }

  const wildcards = wildcardFields(sidc).map((w) => {
    const af = fields.find((x) => x.positions[0] === w.positions[0]);
    const option = WILDCARD_FIELDS.find((x) => x.field === w.field)?.option ?? w.option;
    return af?.alternatives !== undefined
      ? { field: w.field, positions: w.positions, option, alternatives: af.alternatives }
      : { field: w.field, positions: w.positions, option };
  });

  return {
    validation,
    fields,
    isTemplate: validation.isTemplate,
    wildcards,
    evidence: validation.valid ? adapters.flatMap((a) => a.lookup(sidc)) : [],
  };
}
