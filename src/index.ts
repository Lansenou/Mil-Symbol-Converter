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
