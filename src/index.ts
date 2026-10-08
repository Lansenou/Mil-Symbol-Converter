export type * from "./types";
export {
  convertSidc,
  convertSidc15To12,
  convertSidc15To2525D,
  convertSidc15To2525E,
  convertSidc15ToApp6D,
  convertSidc15ToApp6E,
  convertSidcToAll,
  ALL_TARGETS,
} from "./converters/converter";
export {
  convertNumericTo2525C,
  type ReverseOptions,
} from "./converters/reverse";
export {
  LEGACY12_PROFILES,
  type Legacy12Profile,
} from "./converters/legacy-12";
export {
  NUMERIC_TARGETS,
  convertToNumeric,
  type NumericTarget,
} from "./converters/numeric";
export { validateSidc, parseLegacyFields, normalizeInput } from "./validation";
export {
  resolveWildcards,
  wildcardFields,
  WILDCARD_FIELDS,
  type WildcardResolution,
} from "./wildcard";
export {
  analyzeSidc,
  type SidcAnalysis,
  type AnalyzedField,
} from "./sidc-analyzer";
export {
  defaultAdapters,
  jmsmlAdapter,
  milsymAdapter,
  type MappingAdapter,
  type MappingEvidence,
} from "./adapters/symbology-adapter";
export {
  Affiliation,
  AffiliationLetter,
  Status,
  StatusLetter,
  Echelon,
  EchelonLetter,
  UnitIndicator,
  UnitIndicatorLetter,
  SymbolModifier,
  SymbolModifierLetter,
  OrderOfBattle,
  OrderOfBattleLetter,
  echelonModifier,
  isAffiliation,
  isStatus,
  isSymbolModifier,
  isCountryCode,
  isOrderOfBattle,
} from "./codes";
export type { CountryCode } from "./codes";
export {
  SidcStandard,
  NumericSourceStandard,
  MatchQuality,
  WildcardPolicy,
  MappingSource,
  Mil2525dVersion,
  DiagnosticSeverity,
  DiagnosticCode,
  FuzzyMethod,
  Confidence,
  CodingScheme,
  CodingSchemeLetter,
} from "./constants";
export {
  CODING_SCHEMES,
  STANDARD_IDENTITIES,
  DIMENSIONS,
  STATUSES,
  ECHELONS,
  SYMBOL_MODIFIERS,
  ORDERS_OF_BATTLE,
  WILDCARD_POSITIONS,
} from "./legacy/fields";
export { SYMBOL_SET_NAMES } from "./data/index";
export type { WildcardFieldName, WildcardField } from "./wildcard";
export type { LegacySidcFields } from "./types";
