/**
 * Runtime values for every string union in the public types, so callers can write
 * `MatchQuality.Exact`, iterate `Object.values(SidcStandard)`, or use `keyof typeof`.
 * Each constant and its type share a name; the literals stay interchangeable with the names.
 */

const values = <T extends Record<string, string>>(o: T) => o;

export const SidcStandard = values({
  MilStd2525C: "MIL-STD-2525C",
  MilStd2525D: "MIL-STD-2525D",
  MilStd2525E: "MIL-STD-2525E",
  App6C: "APP-6C",
  App6D: "APP-6D",
  App6E: "APP-6E",
  Legacy12: "LEGACY-12",
} as const);
export type SidcStandard = (typeof SidcStandard)[keyof typeof SidcStandard];

/** Numeric standards that can be converted back to 2525C. */
export const NumericSourceStandard = values({
  MilStd2525D: "MIL-STD-2525D",
  App6D: "APP-6D",
  MilStd2525E: "MIL-STD-2525E",
  App6E: "APP-6E",
} as const);
export type NumericSourceStandard =
  (typeof NumericSourceStandard)[keyof typeof NumericSourceStandard];

export const MatchQuality = values({
  Exact: "exact",
  Equivalent: "equivalent",
  Lossy: "lossy",
  Approximate: "approximate",
  Ambiguous: "ambiguous",
  Unsupported: "unsupported",
} as const);
export type MatchQuality = (typeof MatchQuality)[keyof typeof MatchQuality];

export const WildcardPolicy = values({
  Preserve: "preserve",
  Resolve: "resolve",
  Reject: "reject",
} as const);
export type WildcardPolicy =
  (typeof WildcardPolicy)[keyof typeof WildcardPolicy];

/** Mapping evidence providers. */
export const MappingSource = values({
  JMSML: "JMSML",
  MilSymTs: "mil-sym-ts",
} as const);
export type MappingSourceName =
  (typeof MappingSource)[keyof typeof MappingSource];

export const Mil2525dVersion = values({
  Base: "10",
  Change1: "11",
} as const);
export type Mil2525dVersion =
  (typeof Mil2525dVersion)[keyof typeof Mil2525dVersion];

export const DiagnosticSeverity = values({
  Error: "error",
  Warning: "warning",
  Info: "info",
} as const);
export type DiagnosticSeverity =
  (typeof DiagnosticSeverity)[keyof typeof DiagnosticSeverity];

export const FuzzyMethod = values({
  SourceChoice: "source-choice",
  NameMatch: "name-match",
  Ancestor: "ancestor",
} as const);
export type FuzzyMethod = (typeof FuzzyMethod)[keyof typeof FuzzyMethod];

export const Confidence = values({
  Corroborated: "corroborated",
  SingleSource: "single-source",
} as const);
export type Confidence = (typeof Confidence)[keyof typeof Confidence];

/** 2525C position 1: `CodingScheme` holds full names, `CodingSchemeLetter` the letters. */
export const CodingSchemeLetter = values({
  Warfighting: "S",
  TacticalGraphics: "G",
  Metoc: "W",
  SignalsIntelligence: "I",
  StabilityOperations: "O",
  EmergencyManagement: "E",
} as const);
export const CodingScheme = {
  Warfighting: "Warfighting",
  TacticalGraphics: "TacticalGraphics",
  Metoc: "Metoc",
  SignalsIntelligence: "SignalsIntelligence",
  StabilityOperations: "StabilityOperations",
  EmergencyManagement: "EmergencyManagement",
} as const;
export type CodingScheme = keyof typeof CodingSchemeLetter;
export type CodingSchemeLetter =
  (typeof CodingSchemeLetter)[keyof typeof CodingSchemeLetter];

/** Every `Diagnostic.code` the library emits. Stable: codes are only ever added. */
export const DiagnosticCode = values({
  CANDIDATE_REJECTED: "CANDIDATE_REJECTED",
  CONTESTED_CODE: "CONTESTED_CODE",
  DISTINCTION_MERGED: "DISTINCTION_MERGED",
  EMPTY_INPUT: "EMPTY_INPUT",
  EQUIVALENT_BY_CATALOG: "EQUIVALENT_BY_CATALOG",
  FIELDS_DROPPED: "FIELDS_DROPPED",
  FIXED_POSITIONS_FILLED: "FIXED_POSITIONS_FILLED",
  FUZZY_RESULT: "FUZZY_RESULT",
  INSTALLATION_INDICATOR_NOT_APPLICABLE:
    "INSTALLATION_INDICATOR_NOT_APPLICABLE",
  INSTALLATION_INDICATOR_REQUIRED: "INSTALLATION_INDICATOR_REQUIRED",
  INTERNAL_INVALID_OUTPUT: "INTERNAL_INVALID_OUTPUT",
  INVALID_CHARACTERS: "INVALID_CHARACTERS",
  INVALID_CODING_SCHEME: "INVALID_CODING_SCHEME",
  INVALID_FIELD_VALUE: "INVALID_FIELD_VALUE",
  INVALID_LENGTH: "INVALID_LENGTH",
  INVALID_NUMERIC_SIDC: "INVALID_NUMERIC_SIDC",
  INVALID_RESOLUTION_VALUE: "INVALID_RESOLUTION_VALUE",
  INVALID_TYPE: "INVALID_TYPE",
  INVALID_WILDCARD_POSITION: "INVALID_WILDCARD_POSITION",
  LISTED_TWICE_IN_2525C: "LISTED_TWICE_IN_2525C",
  LOSSY_NOT_ALLOWED: "LOSSY_NOT_ALLOWED",
  LOWERCASE: "LOWERCASE",
  LOWERCASE_NORMALIZED: "LOWERCASE_NORMALIZED",
  METOC_STATUS_DEFAULT: "METOC_STATUS_DEFAULT",
  MORE_SPECIFIC_ALTERNATIVES: "MORE_SPECIFIC_ALTERNATIVES",
  NAME_WORDING_DIFFERS: "NAME_WORDING_DIFFERS",
  NONSTANDARD_ORDER_OF_BATTLE: "NONSTANDARD_ORDER_OF_BATTLE",
  NOT_IN_2525C_TABLES: "NOT_IN_2525C_TABLES",
  NO_MAPPING: "NO_MAPPING",
  NO_VALID_MAPPING: "NO_VALID_MAPPING",
  ONLY_MORE_SPECIFIC_SYMBOLS: "ONLY_MORE_SPECIFIC_SYMBOLS",
  OPTION_IGNORED: "OPTION_IGNORED",
  PARENT_SYMBOL_USED: "PARENT_SYMBOL_USED",
  PREFERRED_SOURCE_USED: "PREFERRED_SOURCE_USED",
  PROFILE: "PROFILE",
  RENUMBERED: "RENUMBERED",
  RETIRED_IN_SOURCE: "RETIRED_IN_SOURCE",
  SEVERAL_2525C_SYMBOLS: "SEVERAL_2525C_SYMBOLS",
  SINGLE_SOURCE: "SINGLE_SOURCE",
  SOURCES_DISAGREE: "SOURCES_DISAGREE",
  SOURCES_DISAGREE_ON_MEANING: "SOURCES_DISAGREE_ON_MEANING",
  STATUS_MERGED: "STATUS_MERGED",
  SURROUNDING_WHITESPACE: "SURROUNDING_WHITESPACE",
  TEMPLATE_OUTPUT: "TEMPLATE_OUTPUT",
  TYPOGRAPHIC_DASHES_REPAIRED: "TYPOGRAPHIC_DASHES_REPAIRED",
  UNKNOWN_PROFILE: "UNKNOWN_PROFILE",
  UNKNOWN_SYMBOL: "UNKNOWN_SYMBOL",
  UNMAPPED_MODIFIER: "UNMAPPED_MODIFIER",
  UNMAPPED_STANDARD_IDENTITY: "UNMAPPED_STANDARD_IDENTITY",
  UNMAPPED_STATUS: "UNMAPPED_STATUS",
  UNRESOLVED_WILDCARD: "UNRESOLVED_WILDCARD",
  UNSUPPORTED_EXTENSION: "UNSUPPORTED_EXTENSION",
  UNSUPPORTED_SOURCE: "UNSUPPORTED_SOURCE",
  UNSUPPORTED_TARGET: "UNSUPPORTED_TARGET",
  UNSUPPORTED_VERSION: "UNSUPPORTED_VERSION",
  VERSION_10_AS_2525D: "VERSION_10_AS_2525D",
  VERSION_MISMATCH: "VERSION_MISMATCH",
  WHITESPACE_TRIMMED: "WHITESPACE_TRIMMED",
  WILDCARD_DEFAULTED: "WILDCARD_DEFAULTED",
  WILDCARDS_RESOLVED: "WILDCARDS_RESOLVED",
  WILDCARD_NOT_CARRIED: "WILDCARD_NOT_CARRIED",
  WILDCARD_REJECTED: "WILDCARD_REJECTED",
} as const);
export type DiagnosticCode =
  (typeof DiagnosticCode)[keyof typeof DiagnosticCode];
