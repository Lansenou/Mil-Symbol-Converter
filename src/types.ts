import type {
  Affiliation,
  AffiliationLetter,
  CountryCode,
  OrderOfBattle,
  OrderOfBattleLetter,
  Status,
  StatusLetter,
  SymbolModifier,
  SymbolModifierLetter,
} from "./codes";

/**
 * Public types for the SIDC converter.
 *
 * Terminology follows MIL-STD-2525C (letter-based, 15 characters) and MIL-STD-2525D/E,
 * APP-6(D)/(E) (numeric, 20 digits). See docs/standards-research.md.
 */

export type {
  SidcStandard,
  MatchQuality,
  WildcardPolicy,
  MappingSourceName,
  Mil2525dVersion,
  DiagnosticSeverity,
  DiagnosticCode,
  FuzzyMethod,
  Confidence,
  NumericSourceStandard,
  CodingScheme,
  CodingSchemeLetter,
} from "./constants";
import type {
  SidcStandard,
  MatchQuality,
  WildcardPolicy,
  MappingSourceName,
  Mil2525dVersion,
  DiagnosticSeverity,
  DiagnosticCode,
  FuzzyMethod,
  Confidence,
} from "./constants";

/**
 * How faithfully the output represents the input.
 *
 * - `exact`: the target code is the documented counterpart in a dataset native to the target
 *   edition, and every field of the input is carried over.
 * - `equivalent`: the same symbol, established by matching the code and its name in the target
 *   edition's catalog rather than by a mapping table written for that edition.
 * - `lossy`: a valid output exists but some information of the input is not represented
 *   (for example a country code, or a 2525C distinction that the target merged).
 * - `approximate`: only with `fuzzy: true`. A best guess from name similarity, with a calibrated
 *   `fuzzy.certainty`; not a documented equivalence.
 * - `ambiguous`: more than one output is supported by the evidence; no output is chosen.
 * - `unsupported`: no output can be produced without inventing data.
 */

export interface ConversionOptions {
  /** Only MIL-STD-2525C letter SIDCs are accepted as input. */
  sourceStandard?: SidcStandard;
  /** Used by `convertSidc`. Defaults to MIL-STD-2525D. */
  targetStandard?: SidcStandard;
  /** Standard identity for a `*` in position 2: full name ("Hostile") or 2525C letter ("H"). */
  affiliation?: Affiliation | AffiliationLetter;
  /** Status for a `*` in position 4: full name ("Present") or 2525C letter ("P"). */
  status?: Status | StatusLetter;
  /** Positions 11-12 for `*`: a name ("None", "Installation") or two characters ("--", "-E"; see `echelonModifier`). */
  symbolModifier?: SymbolModifier | SymbolModifierLetter;
  /** Two characters used to resolve `*` in positions 13-14 (ISO 3166-1 alpha-2 or "--"). */
  countryCode?: CountryCode;
  /** Order of battle for a `*` in position 15: full name ("Ground") or letter ("G"). */
  orderOfBattle?: OrderOfBattle | OrderOfBattleLetter;
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
  /**
   * Allow the 30-digit SIDC for MIL-STD-2525E / APP-6(E) when a modifier only exists there as a
   * common modifier (indicator in position 21 or 22). Defaults to `false` (20 digits only).
   */
  extendedSidc?: boolean;
  /**
   * When the strict mapping fails, try approximate matching: choose between disagreeing sources by
   * name, search the target catalog by the 2525C description, or fall back to the nearest mapped
   * 2525C ancestor (lossy). Defaults to `false`. Implies `allowLossy: true` unless that is set to
   * `false`: an approximate result promises less than a lossy one.
   */
  fuzzy?: boolean;
  /** Minimum calibrated certainty (0-1) for `approximate` results. Defaults to 0.7. */
  minCertainty?: number;
  /** Reject lowercase letters and surrounding whitespace instead of normalizing them. */
  strictInput?: boolean;
}

export interface Diagnostic {
  severity: DiagnosticSeverity;
  /** Stable machine-readable code, e.g. "INVALID_LENGTH" (see `DiagnosticCode`). */
  code: DiagnosticCode;
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
  confidence?: Confidence;
  candidates?: ConversionCandidate[];
  /** 1-based positions whose unresolved value makes the result ambiguous. */
  ambiguousPositions?: number[];
  metadata?: ConversionMetadata;
  /** Present only for results produced by `fuzzy: true`. */
  fuzzy?: FuzzyInfo;
}

export interface FuzzyInfo {
  method: FuzzyMethod;
  /**
   * For name-based methods: measured precision of the matcher at this score (see
   * scripts/calibrate-fuzzy.ts). For "ancestor": 1, the output is a documented broader symbol.
   */
  certainty: number;
  /** What the guess is based on. */
  basis: string;
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
