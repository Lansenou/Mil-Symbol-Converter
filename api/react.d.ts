import { CheckedSidc, ConversionOptions, ConversionResult, RenderOptions, RenderableSidc, SidcStandard } from '../index.js';
export { ALL_TARGETS, Affiliation, AffiliationLetter, AnalyzedField, CODING_SCHEMES, CodingScheme, CodingSchemeLetter, Confidence, ConversionCandidate, ConversionMetadata, CotToSidcOptions, CotToSidcResult, CountryCode, DIMENSIONS, Diagnostic, DiagnosticCode, DiagnosticSeverity, DisEntityType, DisToSidcOptions, DisToSidcResult, ECHELONS, Echelon, EchelonLetter, EditionKey, FallbackKey, FilledField, FuzzyInfo, FuzzyMethod, InputKind, LEGACY12_PROFILES, Legacy12Profile, LegacySidcFields, MSDL_HOSTILITY_TO_AFFILIATION, MappingAdapter, MappingEvidence, MappingSource, MappingSourceName, MatchQuality, Mil2525dVersion, MsdlForceSide, MsdlOptions, MsdlScenario, MsdlSymbol, NUMERIC_TARGETS, NumericSourceStandard, NumericTarget, ORDERS_OF_BATTLE, OrderOfBattle, OrderOfBattleLetter, ReadSidcOptions, ReadSidcResult, ReverseOptions, STANDARD_IDENTITIES, STATUSES, SYMBOL_MODIFIERS, SYMBOL_SET_NAMES, SidcAnalysis, SidcToCotResult, SidcToDisResult, Status, StatusLetter, SymbolModifier, SymbolModifierLetter, TypeOptions, UnitIndicator, UnitIndicatorLetter, ValidateSidcLiteral, ValidationResult, WILDCARD_FIELDS, WILDCARD_POSITIONS, WildcardField, WildcardFieldName, WildcardPolicy, WildcardResolution, affiliationToForceId, analyzeSidc, convertNumericTo2525C, convertSidc, convertSidc15To12, convertSidc15To2525D, convertSidc15To2525E, convertSidc15ToApp6D, convertSidc15ToApp6E, convertSidcToAll, convertToNumeric, cotToSidc, defaultAdapters, detectInput, disToSidc, echelonModifier, forceIdToAffiliation, isAffiliation, isCountryCode, isOrderOfBattle, isStatus, isSymbolModifier, jmsmlAdapter, milsymAdapter, readMsdl, readSidc, resolveWildcards, setCacheSize, sidc, sidcToCot, sidcToDis, toRenderableSidc, validateSidc, wildcardFields } from '../index.js';
import * as react from 'react';
import { CSSProperties } from 'react';

/**
 * Memoized conversion for React. The result object only changes when the input or one of the
 * option values changes, so it is safe to use in dependency arrays. Invalid input never throws;
 * it yields a result with `success: false` and structured `diagnostics`.
 */
declare function useSidcConverter<const S extends string>(input: CheckedSidc<S>, options?: ConversionOptions): ConversionResult;

/**
 * Memoized `toRenderableSidc` for React: a code to draw from a SIDC read from data, with what was
 * filled in or left out. The result only changes when the input or an option value changes, so it
 * is safe in dependency arrays. Never throws; `sidc` is null when nothing usable can be made.
 *
 * ```tsx
 * const { output, filled } = useRenderableSidc(unit.sidc, { fallback: { affiliation: "Hostile" } });
 * const svg = useMemo(() => (output ? new ms.Symbol(output).asSVG() : null), [output]);
 * ```
 */
declare function useRenderableSidc(input: string | null | undefined, options?: RenderOptions): RenderableSidc;

interface SidcConverterProps {
    initialSidc?: string;
    initialTarget?: SidcStandard;
    style?: CSSProperties;
}
/** Minimal, dependency-free converter UI. */
declare function SidcConverter({ initialSidc, initialTarget, style, }: SidcConverterProps): react.JSX.Element;

export { CheckedSidc, ConversionOptions, ConversionResult, RenderOptions, RenderableSidc, SidcConverter, type SidcConverterProps, SidcStandard, useRenderableSidc, useSidcConverter };
