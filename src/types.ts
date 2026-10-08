/**
 * Public types for the SIDC converter.
 *
 * Terminology follows MIL-STD-2525C (letter-based, 15 characters) and MIL-STD-2525D/E,
 * APP-6(D)/(E) (numeric, 20 digits). See docs/standards-research.md.
 */

export type SidcStandard =
  | "MIL-STD-2525C"
  | "MIL-STD-2525D"
  | "MIL-STD-2525E"
  | "APP-6C"
  | "APP-6D"
  | "APP-6E"
  | "LEGACY-12";

/**
 * How faithfully the output represents the input.
 *
 * - `exact`: the target code is the documented counterpart in a dataset native to the target
 *   edition, and every field of the input is carried over.
 * - `equivalent`: the same symbol, established by matching the code and its name in the target
 *   edition's catalog rather than by a mapping table written for that edition.
 * - `lossy`: a valid output exists but some information of the input is not represented
 *   (for example a country code, or a 2525C distinction that the target merged).
 * - `ambiguous`: more than one output is supported by the evidence; no output is chosen.
 * - `unsupported`: no output can be produced without inventing data.
 */
export type MatchQuality = "exact" | "equivalent" | "lossy" | "ambiguous" | "unsupported";

export type WildcardPolicy = "preserve" | "resolve" | "reject";

/** Mapping evidence providers. */
export type MappingSourceName = "JMSML" | "mil-sym-ts";

export type Mil2525dVersion = "10" | "11";

export interface ConversionOptions {
  /** Only MIL-STD-2525C letter SIDCs are accepted as input. */
  sourceStandard?: SidcStandard;
  /** Used by `convertSidc`. Defaults to MIL-STD-2525D. */
  targetStandard?: SidcStandard;
  /** 2525C standard identity letter used to resolve a `*` in position 2 (e.g. "F", "H"). */
  affiliation?: string;
  /** 2525C status letter used to resolve a `*` in position 4 (e.g. "P", "A"). */
  status?: string;
  /** Two characters used to resolve `*` in positions 11-12 (e.g. "--", "-E", "A-"). */
  symbolModifier?: string;
  /** Two characters used to resolve `*` in positions 13-14 (ISO 3166-1 alpha-2 or "--"). */
  countryCode?: string;
  /** One character used to resolve a `*` in position 15. */
  orderOfBattle?: string;
  /**
   * - `resolve` (default): replace `*` only with values supplied in these options; any
   *   remaining wildcard that the target needs makes the conversion fail.
   * - `preserve`: keep `*` where the target format can carry it (LEGACY-12 only).
   * - `reject`: any `*` in the input is an error.
   */
  wildcardPolicy?: WildcardPolicy;
  /** Accept lossy conversions. Defaults to `false` (strict). */
  allowLossy?: boolean;
  /** Named 12-character profile. Only "prefix-12" is defined. */
  legacy12Profile?: string;
  /** Version digits for MIL-STD-2525D output: "10" (2525D) or "11" (2525D Change 1). */
  mil2525dVersion?: Mil2525dVersion;
  /** When the mapping sources disagree, use this one instead of reporting ambiguity. */
  preferredSource?: MappingSourceName;
  /** Reject lowercase letters and surrounding whitespace instead of normalizing them. */
  strictInput?: boolean;
}

export type DiagnosticSeverity = "error" | "warning" | "info";

export interface Diagnostic {
  severity: DiagnosticSeverity;
  /** Stable machine-readable code, e.g. "INVALID_LENGTH". */
  code: string;
  message: string;
  /** 1-based SIDC positions the diagnostic refers to. */
  positions?: number[];
}

export interface ConversionCandidate {
  output: string;
  matchQuality: MatchQuality;
  sources: string[];
  note: string;
}

export interface ConversionMetadata {
  codingScheme?: string;
  legacyDescription?: string;
  legacyHierarchy?: string;
  symbolSet?: string;
  symbolSetName?: string;
  affiliation?: string;
  status?: string;
  entity?: string;
  entityCode?: string;
  modifiers?: string[];
  version?: string;
  /** Input fields that have no place in the output (e.g. country code). */
  droppedFields?: Record<string, string>;
}

export interface ConversionResult {
  input: string;
  /** The validated, normalized (and possibly wildcard-resolved) 15-character input. */
  normalizedInput: string | null;
  output: string | null;
  sourceStandard: SidcStandard;
  targetStandard: SidcStandard;
  matchQuality: MatchQuality;
  success: boolean;
  warnings: string[];
  errors: string[];
  diagnostics: Diagnostic[];
  mappingSource?: string;
  confidence?: "corroborated" | "single-source";
  candidates?: ConversionCandidate[];
  /** 1-based positions whose unresolved value makes the result ambiguous. */
  ambiguousPositions?: number[];
  metadata?: ConversionMetadata;
}

export interface LegacySidcFields {
  codingScheme: string;
  /** Position 2: standard identity (category for METOC). */
  standardIdentity: string;
  /** Position 3: battle dimension / category (static/dynamic for METOC, with position 4). */
  battleDimension: string;
  /** Position 4: status (static/dynamic for METOC). */
  status: string;
  /** Positions 5-10. */
  functionId: string;
  /** Positions 11-12 (graphic type for METOC, with position 13). */
  symbolModifier: string;
  /** Positions 13-14. */
  countryCode: string;
  /** Position 15. */
  orderOfBattle: string;
}

export interface ValidationResult {
  input: unknown;
  valid: boolean;
  normalized: string | null;
  isTemplate: boolean;
  wildcardPositions: number[];
  fields: LegacySidcFields | null;
  errors: string[];
  warnings: string[];
  diagnostics: Diagnostic[];
  /** Matching row of the MIL-STD-2525C SIDC tables, if any. */
  catalogEntry?: { template: string; description: string; hierarchy: string };
}
