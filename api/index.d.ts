declare const Affiliation: {
    Pending: "Pending";
    Unknown: "Unknown";
    AssumedFriend: "AssumedFriend";
    Friend: "Friend";
    Neutral: "Neutral";
    Suspect: "Suspect";
    Hostile: "Hostile";
    ExercisePending: "ExercisePending";
    ExerciseUnknown: "ExerciseUnknown";
    ExerciseAssumedFriend: "ExerciseAssumedFriend";
    ExerciseFriend: "ExerciseFriend";
    ExerciseNeutral: "ExerciseNeutral";
    Joker: "Joker";
    Faker: "Faker";
};
type Affiliation = keyof typeof AffiliationLetter;
/**
 * Named constants for the 2525C values callers pass as options (the overrides for `*`).
 *
 * Each field has two constants:
 * - `Affiliation` holds full names: `Affiliation.Hostile === "Hostile"`.
 * - `AffiliationLetter` maps each name to its 2525C letter: `AffiliationLetter.Hostile === "H"`.
 *
 * Options accept either form (`affiliation: "Hostile"` or `affiliation: "H"`); names are matched
 * case-insensitively. The letters are those of the MIL-STD-2525C field tables
 * (`src/legacy/fields.ts`); whether a value fits a given coding scheme is checked at runtime.
 */
/** Position 2: standard identity (Tables A-I, B-I, D-I, E-I, G-I). */
declare const AffiliationLetter: {
    readonly Pending: "P";
    readonly Unknown: "U";
    readonly AssumedFriend: "A";
    readonly Friend: "F";
    readonly Neutral: "N";
    readonly Suspect: "S";
    readonly Hostile: "H";
    readonly ExercisePending: "G";
    readonly ExerciseUnknown: "W";
    readonly ExerciseAssumedFriend: "M";
    readonly ExerciseFriend: "D";
    readonly ExerciseNeutral: "L";
    readonly Joker: "J";
    readonly Faker: "K";
};
type AffiliationLetter = (typeof AffiliationLetter)[Affiliation];
declare const Status: {
    Anticipated: "Anticipated";
    Present: "Present";
    FullyCapable: "FullyCapable";
    Damaged: "Damaged";
    Destroyed: "Destroyed";
    FullToCapacity: "FullToCapacity";
    Suspected: "Suspected";
    Known: "Known";
};
type Status = keyof typeof StatusLetter;
/**
 * Position 4: status. FullyCapable, Damaged, Destroyed and FullToCapacity exist for
 * warfighting, SIGINT and stability operations only; Suspected and Known for tactical graphics
 * only (Table B-I).
 */
declare const StatusLetter: {
    readonly Anticipated: "A";
    readonly Present: "P";
    readonly FullyCapable: "C";
    readonly Damaged: "D";
    readonly Destroyed: "X";
    readonly FullToCapacity: "F";
    readonly Suspected: "S";
    readonly Known: "K";
};
type StatusLetter = (typeof StatusLetter)[Status];
declare const Echelon: {
    TeamCrew: "TeamCrew";
    Squad: "Squad";
    Section: "Section";
    Platoon: "Platoon";
    Company: "Company";
    Battalion: "Battalion";
    Regiment: "Regiment";
    Brigade: "Brigade";
    Division: "Division";
    Corps: "Corps";
    Army: "Army";
    ArmyGroup: "ArmyGroup";
    Region: "Region";
    Command: "Command";
};
type Echelon = keyof typeof EchelonLetter;
/** Position 12 echelon (Tables A-II, B-II, E-II). */
declare const EchelonLetter: {
    readonly TeamCrew: "A";
    readonly Squad: "B";
    readonly Section: "C";
    readonly Platoon: "D";
    readonly Company: "E";
    readonly Battalion: "F";
    readonly Regiment: "G";
    readonly Brigade: "H";
    readonly Division: "I";
    readonly Corps: "J";
    readonly Army: "K";
    readonly ArmyGroup: "L";
    readonly Region: "M";
    readonly Command: "N";
};
type EchelonLetter = (typeof EchelonLetter)[Echelon];
declare const UnitIndicator: {
    Headquarters: "Headquarters";
    TaskForceHeadquarters: "TaskForceHeadquarters";
    FeintDummyHeadquarters: "FeintDummyHeadquarters";
    FeintDummyTaskForceHeadquarters: "FeintDummyTaskForceHeadquarters";
    TaskForce: "TaskForce";
    FeintDummy: "FeintDummy";
    FeintDummyTaskForce: "FeintDummyTaskForce";
};
type UnitIndicator = keyof typeof UnitIndicatorLetter;
/** Position 11 headquarters / task force / feint-dummy indicator (Tables A-II, E-II). */
declare const UnitIndicatorLetter: {
    readonly Headquarters: "A";
    readonly TaskForceHeadquarters: "B";
    readonly FeintDummyHeadquarters: "C";
    readonly FeintDummyTaskForceHeadquarters: "D";
    readonly TaskForce: "E";
    readonly FeintDummy: "F";
    readonly FeintDummyTaskForce: "G";
};
type UnitIndicatorLetter = (typeof UnitIndicatorLetter)[UnitIndicator];
declare const SymbolModifier: {
    None: "None";
    Installation: "Installation";
    FeintDummyInstallation: "FeintDummyInstallation";
    MobilityWheeled: "MobilityWheeled";
    MobilityCrossCountry: "MobilityCrossCountry";
    MobilityTracked: "MobilityTracked";
    MobilityWheeledAndTracked: "MobilityWheeledAndTracked";
    MobilityTowed: "MobilityTowed";
    MobilityRail: "MobilityRail";
    MobilityOverSnow: "MobilityOverSnow";
    MobilitySled: "MobilitySled";
    MobilityPackAnimals: "MobilityPackAnimals";
    MobilityBarge: "MobilityBarge";
    MobilityAmphibious: "MobilityAmphibious";
    TowedArrayShort: "TowedArrayShort";
    TowedArrayLong: "TowedArrayLong";
};
type SymbolModifier = keyof typeof SymbolModifierLetter;
/** Positions 11-12 values that are not an echelon combination (use `echelonModifier` for those). */
declare const SymbolModifierLetter: {
    readonly None: "--";
    readonly Installation: "H-";
    readonly FeintDummyInstallation: "HB";
    readonly MobilityWheeled: "MO";
    readonly MobilityCrossCountry: "MP";
    readonly MobilityTracked: "MQ";
    readonly MobilityWheeledAndTracked: "MR";
    readonly MobilityTowed: "MS";
    readonly MobilityRail: "MT";
    readonly MobilityOverSnow: "MU";
    readonly MobilitySled: "MV";
    readonly MobilityPackAnimals: "MW";
    readonly MobilityBarge: "MX";
    readonly MobilityAmphibious: "MY";
    readonly TowedArrayShort: "NS";
    readonly TowedArrayLong: "NL";
};
/** Positions 11-12: any two-character value of the 2525C modifier tables. */
type SymbolModifierLetter = (typeof SymbolModifierLetter)[SymbolModifier] | `-${EchelonLetter}` | `${UnitIndicatorLetter}-` | `${UnitIndicatorLetter}${EchelonLetter}`;
declare const OrderOfBattle: {
    None: "None";
    Air: "Air";
    Electronic: "Electronic";
    Civilian: "Civilian";
    Ground: "Ground";
    Maritime: "Maritime";
    StrategicForceRelated: "StrategicForceRelated";
    ControlMarkings: "ControlMarkings";
};
type OrderOfBattle = keyof typeof OrderOfBattleLetter;
/** Position 15: order of battle ("ControlMarkings" X for tactical graphics, "None" for -). */
declare const OrderOfBattleLetter: {
    readonly None: "-";
    readonly Air: "A";
    readonly Electronic: "E";
    readonly Civilian: "C";
    readonly Ground: "G";
    readonly Maritime: "N";
    readonly StrategicForceRelated: "S";
    readonly ControlMarkings: "X";
};
type OrderOfBattleLetter = (typeof OrderOfBattleLetter)[OrderOfBattle];
/** Builds positions 11-12 from an echelon and an optional indicator: `echelonModifier("Battalion", "Headquarters")` is `"AF"`. */
declare function echelonModifier(echelon: Echelon | EchelonLetter, indicator?: UnitIndicator | UnitIndicatorLetter): SymbolModifierLetter;
type Upper$1 = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";
/** Positions 13-14: ISO 3166-1 alpha-2 code, or "--" for none. */
type CountryCode = `${Upper$1}${Upper$1}` | "--";
/** Type guards for values read at runtime (form fields, files, other systems): name or letter. */
declare const isAffiliation: (v: unknown) => v is Affiliation | AffiliationLetter;
declare const isStatus: (v: unknown) => v is Status | StatusLetter;
declare const isOrderOfBattle: (v: unknown) => v is OrderOfBattle | OrderOfBattleLetter;
declare const isSymbolModifier: (v: unknown) => v is SymbolModifier | SymbolModifierLetter;
declare const isCountryCode: (v: unknown) => v is CountryCode;

/**
 * Runtime values for every string union in the public types, so callers can write
 * `MatchQuality.Exact`, iterate `Object.values(SidcStandard)`, or use `keyof typeof`.
 * Each constant and its type share a name; the literals stay interchangeable with the names.
 */
declare const SidcStandard: {
    readonly MilStd2525C: "MIL-STD-2525C";
    readonly MilStd2525D: "MIL-STD-2525D";
    readonly MilStd2525E: "MIL-STD-2525E";
    readonly App6C: "APP-6C";
    readonly App6D: "APP-6D";
    readonly App6E: "APP-6E";
    readonly Legacy12: "LEGACY-12";
};
type SidcStandard = (typeof SidcStandard)[keyof typeof SidcStandard];
/** Numeric standards that can be converted back to 2525C. */
declare const NumericSourceStandard: {
    readonly MilStd2525D: "MIL-STD-2525D";
    readonly App6D: "APP-6D";
    readonly MilStd2525E: "MIL-STD-2525E";
    readonly App6E: "APP-6E";
};
type NumericSourceStandard = (typeof NumericSourceStandard)[keyof typeof NumericSourceStandard];
declare const MatchQuality: {
    readonly Exact: "exact";
    readonly Equivalent: "equivalent";
    readonly Lossy: "lossy";
    readonly Approximate: "approximate";
    readonly Ambiguous: "ambiguous";
    readonly Unsupported: "unsupported";
};
type MatchQuality = (typeof MatchQuality)[keyof typeof MatchQuality];
declare const WildcardPolicy: {
    readonly Preserve: "preserve";
    readonly Resolve: "resolve";
    readonly Reject: "reject";
};
type WildcardPolicy = (typeof WildcardPolicy)[keyof typeof WildcardPolicy];
/** Mapping evidence providers. */
declare const MappingSource: {
    readonly JMSML: "JMSML";
    readonly MilSymTs: "mil-sym-ts";
};
type MappingSourceName = (typeof MappingSource)[keyof typeof MappingSource];
declare const Mil2525dVersion: {
    readonly Base: "10";
    readonly Change1: "11";
};
type Mil2525dVersion = (typeof Mil2525dVersion)[keyof typeof Mil2525dVersion];
declare const DiagnosticSeverity: {
    readonly Error: "error";
    readonly Warning: "warning";
    readonly Info: "info";
};
type DiagnosticSeverity = (typeof DiagnosticSeverity)[keyof typeof DiagnosticSeverity];
declare const FuzzyMethod: {
    readonly SourceChoice: "source-choice";
    readonly NameMatch: "name-match";
    readonly Ancestor: "ancestor";
};
type FuzzyMethod = (typeof FuzzyMethod)[keyof typeof FuzzyMethod];
declare const Confidence: {
    readonly Corroborated: "corroborated";
    readonly SingleSource: "single-source";
};
type Confidence = (typeof Confidence)[keyof typeof Confidence];
declare const CodingScheme$1: {
    readonly Warfighting: "Warfighting";
    readonly TacticalGraphics: "TacticalGraphics";
    readonly Metoc: "Metoc";
    readonly SignalsIntelligence: "SignalsIntelligence";
    readonly StabilityOperations: "StabilityOperations";
    readonly EmergencyManagement: "EmergencyManagement";
};
type CodingScheme$1 = keyof typeof CodingSchemeLetter;
/** 2525C position 1: `CodingScheme` holds full names, `CodingSchemeLetter` the letters. */
declare const CodingSchemeLetter: {
    readonly Warfighting: "S";
    readonly TacticalGraphics: "G";
    readonly Metoc: "W";
    readonly SignalsIntelligence: "I";
    readonly StabilityOperations: "O";
    readonly EmergencyManagement: "E";
};
type CodingSchemeLetter = (typeof CodingSchemeLetter)[keyof typeof CodingSchemeLetter];
/** Every `Diagnostic.code` the library emits. Stable: codes are only ever added. */
declare const DiagnosticCode: {
    readonly CANDIDATE_REJECTED: "CANDIDATE_REJECTED";
    readonly CONTESTED_CODE: "CONTESTED_CODE";
    readonly DISTINCTION_MERGED: "DISTINCTION_MERGED";
    readonly EMPTY_INPUT: "EMPTY_INPUT";
    readonly EQUIVALENT_BY_CATALOG: "EQUIVALENT_BY_CATALOG";
    readonly FIELDS_DROPPED: "FIELDS_DROPPED";
    readonly FIXED_POSITIONS_FILLED: "FIXED_POSITIONS_FILLED";
    readonly FRAME_ONLY: "FRAME_ONLY";
    readonly FUZZY_RESULT: "FUZZY_RESULT";
    readonly INSTALLATION_INDICATOR_NOT_APPLICABLE: "INSTALLATION_INDICATOR_NOT_APPLICABLE";
    readonly INSTALLATION_INDICATOR_REQUIRED: "INSTALLATION_INDICATOR_REQUIRED";
    readonly INTERNAL_INVALID_OUTPUT: "INTERNAL_INVALID_OUTPUT";
    readonly INVALID_CHARACTERS: "INVALID_CHARACTERS";
    readonly INVALID_CODING_SCHEME: "INVALID_CODING_SCHEME";
    readonly INVALID_FIELD_VALUE: "INVALID_FIELD_VALUE";
    readonly INVALID_LENGTH: "INVALID_LENGTH";
    readonly INVALID_NUMERIC_SIDC: "INVALID_NUMERIC_SIDC";
    readonly INVALID_RESOLUTION_VALUE: "INVALID_RESOLUTION_VALUE";
    readonly INVALID_TYPE: "INVALID_TYPE";
    readonly INVALID_WILDCARD_POSITION: "INVALID_WILDCARD_POSITION";
    readonly LISTED_TWICE_IN_2525C: "LISTED_TWICE_IN_2525C";
    readonly LOSSY_NOT_ALLOWED: "LOSSY_NOT_ALLOWED";
    readonly LOWERCASE: "LOWERCASE";
    readonly LOWERCASE_NORMALIZED: "LOWERCASE_NORMALIZED";
    readonly METOC_STATUS_DEFAULT: "METOC_STATUS_DEFAULT";
    readonly MORE_SPECIFIC_ALTERNATIVES: "MORE_SPECIFIC_ALTERNATIVES";
    readonly NAME_WORDING_DIFFERS: "NAME_WORDING_DIFFERS";
    readonly NONSTANDARD_ORDER_OF_BATTLE: "NONSTANDARD_ORDER_OF_BATTLE";
    readonly NOT_IN_2525C_TABLES: "NOT_IN_2525C_TABLES";
    readonly NO_MAPPING: "NO_MAPPING";
    readonly NO_VALID_MAPPING: "NO_VALID_MAPPING";
    readonly ONLY_MORE_SPECIFIC_SYMBOLS: "ONLY_MORE_SPECIFIC_SYMBOLS";
    readonly OPTION_IGNORED: "OPTION_IGNORED";
    readonly PARENT_SYMBOL_USED: "PARENT_SYMBOL_USED";
    readonly PREFERRED_SOURCE_USED: "PREFERRED_SOURCE_USED";
    readonly PROFILE: "PROFILE";
    readonly RENUMBERED: "RENUMBERED";
    readonly RETIRED_IN_SOURCE: "RETIRED_IN_SOURCE";
    readonly SEVERAL_2525C_SYMBOLS: "SEVERAL_2525C_SYMBOLS";
    readonly SINGLE_SOURCE: "SINGLE_SOURCE";
    readonly SOURCES_DISAGREE: "SOURCES_DISAGREE";
    readonly SOURCES_DISAGREE_ON_MEANING: "SOURCES_DISAGREE_ON_MEANING";
    readonly STATUS_MERGED: "STATUS_MERGED";
    readonly STATUS_DASH_AS_WILDCARD: "STATUS_DASH_AS_WILDCARD";
    readonly SURROUNDING_WHITESPACE: "SURROUNDING_WHITESPACE";
    readonly TEMPLATE_OUTPUT: "TEMPLATE_OUTPUT";
    readonly TYPOGRAPHIC_DASHES_REPAIRED: "TYPOGRAPHIC_DASHES_REPAIRED";
    readonly UNKNOWN_PROFILE: "UNKNOWN_PROFILE";
    readonly UNKNOWN_SYMBOL: "UNKNOWN_SYMBOL";
    readonly UNMAPPED_MODIFIER: "UNMAPPED_MODIFIER";
    readonly UNMAPPED_STANDARD_IDENTITY: "UNMAPPED_STANDARD_IDENTITY";
    readonly UNMAPPED_STATUS: "UNMAPPED_STATUS";
    readonly UNRESOLVED_WILDCARD: "UNRESOLVED_WILDCARD";
    readonly UNSUPPORTED_EXTENSION: "UNSUPPORTED_EXTENSION";
    readonly UNSUPPORTED_SOURCE: "UNSUPPORTED_SOURCE";
    readonly UNSUPPORTED_TARGET: "UNSUPPORTED_TARGET";
    readonly UNSUPPORTED_VERSION: "UNSUPPORTED_VERSION";
    readonly VERSION_10_AS_2525D: "VERSION_10_AS_2525D";
    readonly VERSION_MISMATCH: "VERSION_MISMATCH";
    readonly WHITESPACE_TRIMMED: "WHITESPACE_TRIMMED";
    readonly WILDCARD_DEFAULTED: "WILDCARD_DEFAULTED";
    readonly WILDCARDS_RESOLVED: "WILDCARDS_RESOLVED";
    readonly WILDCARD_NOT_CARRIED: "WILDCARD_NOT_CARRIED";
    readonly WILDCARD_REJECTED: "WILDCARD_REJECTED";
};
type DiagnosticCode = (typeof DiagnosticCode)[keyof typeof DiagnosticCode];

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
interface ConversionOptions {
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
    /**
     * Accept a well-formed code whose function ID is not in the MIL-STD-2525C SIDC tables (a
     * warning instead of an error). Defaults to `false`, or to `true` with `fuzzy`.
     */
    allowUnlisted?: boolean;
}
interface Diagnostic {
    severity: DiagnosticSeverity;
    /** Stable machine-readable code, e.g. "INVALID_LENGTH" (see `DiagnosticCode`). */
    code: DiagnosticCode;
    message: string;
    /** 1-based SIDC positions the diagnostic refers to. */
    positions?: number[];
}
interface ConversionCandidate {
    output: string;
    matchQuality: MatchQuality;
    sources: string[];
    note: string;
}
interface ConversionMetadata {
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
interface ConversionResult {
    input: string;
    /** The validated, normalized (and possibly wildcard-resolved) 15-character input. */
    normalizedInput: string | null;
    output: string | null;
    sourceStandard: SidcStandard;
    targetStandard: SidcStandard;
    matchQuality: MatchQuality;
    success: boolean;
    warnings: string[];
    /**
     * What the input said that the output leaves out: the warnings of a lossy or approximate result.
     * Every converter's result has `output` and `lost`.
     */
    lost: string[];
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
interface FuzzyInfo {
    method: FuzzyMethod;
    /**
     * For name-based methods: measured precision of the matcher at this score (see
     * scripts/calibrate-fuzzy.ts). For "ancestor": 1, the output is a documented broader symbol.
     */
    certainty: number;
    /** What the guess is based on. */
    basis: string;
}
interface LegacySidcFields {
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
interface ValidationResult {
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
    catalogEntry?: {
        template: string;
        description: string;
        hierarchy: string;
    };
}

type AffiliationChar = "A" | "D" | "F" | "G" | "H" | "J" | "K" | "L" | "M" | "N" | "P" | "S" | "U" | "W";
interface SchemeTables {
    S: {
        dimension: "A" | "F" | "G" | "P" | "S" | "U" | "X" | "Z";
        status: "A" | "C" | "D" | "F" | "P" | "X";
        modifier: "--" | "-A" | "-B" | "-C" | "-D" | "-E" | "-F" | "-G" | "-H" | "-I" | "-J" | "-K" | "-L" | "-M" | "-N" | "A-" | "AA" | "AB" | "AC" | "AD" | "AE" | "AF" | "AG" | "AH" | "AI" | "AJ" | "AK" | "AL" | "AM" | "AN" | "B-" | "BA" | "BB" | "BC" | "BD" | "BE" | "BF" | "BG" | "BH" | "BI" | "BJ" | "BK" | "BL" | "BM" | "BN" | "C-" | "CA" | "CB" | "CC" | "CD" | "CE" | "CF" | "CG" | "CH" | "CI" | "CJ" | "CK" | "CL" | "CM" | "CN" | "D-" | "DA" | "DB" | "DC" | "DD" | "DE" | "DF" | "DG" | "DH" | "DI" | "DJ" | "DK" | "DL" | "DM" | "DN" | "E-" | "EA" | "EB" | "EC" | "ED" | "EE" | "EF" | "EG" | "EH" | "EI" | "EJ" | "EK" | "EL" | "EM" | "EN" | "F-" | "FA" | "FB" | "FC" | "FD" | "FE" | "FF" | "FG" | "FH" | "FI" | "FJ" | "FK" | "FL" | "FM" | "FN" | "G-" | "GA" | "GB" | "GC" | "GD" | "GE" | "GF" | "GG" | "GH" | "GI" | "GJ" | "GK" | "GL" | "GM" | "GN" | "H-" | "HB" | "MO" | "MP" | "MQ" | "MR" | "MS" | "MT" | "MU" | "MV" | "MW" | "MX" | "MY" | "NL" | "NS";
        orderOfBattle: "A" | "C" | "E" | "G" | "N" | "S";
    };
    G: {
        dimension: "F" | "G" | "M" | "O" | "S" | "T";
        status: "A" | "K" | "P" | "S";
        modifier: "--" | "-A" | "-B" | "-C" | "-D" | "-E" | "-F" | "-G" | "-H" | "-I" | "-J" | "-K" | "-L" | "-M" | "-N";
        orderOfBattle: "X";
    };
    I: {
        dimension: "A" | "G" | "P" | "S" | "U" | "X" | "Z";
        status: "A" | "C" | "D" | "F" | "P" | "X";
        modifier: "--";
        orderOfBattle: "A" | "C" | "E" | "G" | "N" | "S";
    };
    O: {
        dimension: "G" | "I" | "L" | "O" | "P" | "R" | "V";
        status: "A" | "C" | "D" | "F" | "P" | "X";
        modifier: "--" | "-A" | "-B" | "-C" | "-D" | "-E" | "-F" | "-G" | "-H" | "-I" | "-J" | "-K" | "-L" | "-M" | "-N" | "A-" | "AA" | "AB" | "AC" | "AD" | "AE" | "AF" | "AG" | "AH" | "AI" | "AJ" | "AK" | "AL" | "AM" | "AN" | "B-" | "BA" | "BB" | "BC" | "BD" | "BE" | "BF" | "BG" | "BH" | "BI" | "BJ" | "BK" | "BL" | "BM" | "BN" | "C-" | "CA" | "CB" | "CC" | "CD" | "CE" | "CF" | "CG" | "CH" | "CI" | "CJ" | "CK" | "CL" | "CM" | "CN" | "D-" | "DA" | "DB" | "DC" | "DD" | "DE" | "DF" | "DG" | "DH" | "DI" | "DJ" | "DK" | "DL" | "DM" | "DN" | "E-" | "EA" | "EB" | "EC" | "ED" | "EE" | "EF" | "EG" | "EH" | "EI" | "EJ" | "EK" | "EL" | "EM" | "EN" | "F-" | "FA" | "FB" | "FC" | "FD" | "FE" | "FF" | "FG" | "FH" | "FI" | "FJ" | "FK" | "FL" | "FM" | "FN" | "G-" | "GA" | "GB" | "GC" | "GD" | "GE" | "GF" | "GG" | "GH" | "GI" | "GJ" | "GK" | "GL" | "GM" | "GN" | "H-" | "HB";
        orderOfBattle: "A" | "C" | "E" | "G" | "N" | "S";
    };
    E: {
        dimension: "F" | "I" | "N" | "O";
        status: "A" | "P";
        modifier: "--" | "H-" | "MO" | "MP" | "MQ" | "MR" | "MS" | "MT" | "MU" | "MV" | "MW" | "MX" | "MY";
        orderOfBattle: "A" | "C" | "E" | "G" | "N" | "S";
    };
}
/** Function IDs (positions 5-10) per scheme + dimension. */
interface FunctionIds {
    EF: "------" | "A-----" | "AA----" | "AB----" | "AC----" | "AD----" | "AE----" | "AF----" | "AG----" | "B-----" | "BA----" | "BB----" | "BC----" | "BD----" | "BE----" | "BF----" | "C-----" | "CA----" | "CB----" | "CC----" | "CD----" | "CE----" | "CF----" | "CG----" | "CH----" | "CI----" | "CJ----" | "D-----" | "DA----" | "DB----" | "EA----" | "EB----" | "EE----" | "F-----" | "G-----" | "GA----" | "H-----" | "HA----" | "HB----" | "I-----" | "IA----" | "IB----" | "IC----" | "ID----" | "J-----" | "JA----" | "JB----" | "JC----" | "K-----" | "KB----" | "LA----" | "LD----" | "LE----" | "LF----" | "LH----" | "LJ----" | "LK----" | "LM----" | "LO----" | "LP----" | "MA----" | "MB----" | "MC----" | "MD----" | "ME----" | "MF----" | "MG----" | "MH----" | "MI----";
    EI: "------" | "A-----" | "AC----" | "B-----" | "BA----" | "BC----" | "BD----" | "BF----" | "C-----" | "CA----" | "CB----" | "CC----" | "CD----" | "CE----" | "CF----" | "CG----" | "CH----" | "D-----" | "DA----" | "DB----" | "DC----" | "DD----" | "DE----" | "DF----" | "DG----" | "DH----" | "DI----" | "DJ----" | "DK----" | "DL----" | "DM----" | "DN----" | "DO----" | "E-----" | "EA----" | "F-----" | "FA----" | "G-----" | "GA----" | "GB----" | "H-----" | "HA----";
    EN: "------" | "A-----" | "AA----" | "AB----" | "AC----" | "AD----" | "AE----" | "AG----" | "B-----" | "BB----" | "BC----" | "BF----" | "BM----" | "C-----" | "CA----" | "CB----" | "CC----" | "CD----" | "CE----";
    EO: "------" | "A-----" | "AA----" | "AB----" | "AC----" | "AD----" | "AE----" | "AF----" | "AG----" | "AJ----" | "AK----" | "AL----" | "AM----" | "B-----" | "BA----" | "BB----" | "BC----" | "BD----" | "BE----" | "BF----" | "BG----" | "BH----" | "BI----" | "BJ----" | "BK----" | "BL----" | "C-----" | "CA----" | "CB----" | "CC----" | "CD----" | "CE----" | "D-----" | "DA----" | "DB----" | "DC----" | "DD----" | "DDA---" | "DDB---" | "DDC---" | "DE----" | "DEA---" | "DEB---" | "DEC---" | "DF----" | "DFA---" | "DFB---" | "DFC---" | "DG----" | "DGA---" | "DGB---" | "DGC---" | "DH----" | "DHA---" | "DHB---" | "DHC---" | "DI----" | "DIA---" | "DIB---" | "DIC---" | "DJ----" | "DJB---" | "DJC---" | "DK----" | "DL----" | "DLA---" | "DLB---" | "DLC---" | "DM----" | "DMA---" | "DMB---" | "DMC---" | "DN----" | "DNA---" | "DNC---" | "DO----" | "DOA---" | "DOB---" | "DOC---" | "EA----" | "EB----" | "EC----" | "ED----" | "EE----";
    GF: "------" | "A-----" | "AC----" | "ACA---" | "ACAC--" | "ACAI--" | "ACAR--" | "ACB---" | "ACBC--" | "ACBI--" | "ACBR--" | "ACD---" | "ACDC--" | "ACDI--" | "ACDR--" | "ACE---" | "ACEC--" | "ACEI--" | "ACER--" | "ACF---" | "ACFC--" | "ACFI--" | "ACFR--" | "ACN---" | "ACNC--" | "ACNI--" | "ACNR--" | "ACP---" | "ACPC--" | "ACPR--" | "ACR---" | "ACRC--" | "ACRI--" | "ACRR--" | "ACS---" | "ACSC--" | "ACSI--" | "ACSR--" | "ACT---" | "ACV---" | "ACVC--" | "ACVI--" | "ACVR--" | "ACZ---" | "ACZC--" | "ACZI--" | "ACZR--" | "AK----" | "AKB---" | "AKBC--" | "AKBI--" | "AKBR--" | "AKP---" | "AKPC--" | "AKPI--" | "AKPR--" | "AT----" | "ATB---" | "ATC---" | "ATG---" | "ATR---" | "ATS---" | "AX----" | "AXC---" | "AXS---" | "AZ----" | "AZC---" | "AZCI--" | "AZCR--" | "AZF---" | "AZFI--" | "AZFR--" | "AZI---" | "AZII--" | "AZX---" | "AZXI--" | "AZXR--" | "L-----" | "LC----" | "LCC---" | "LCF---" | "LCM---" | "LCN---" | "LCR---" | "LT----" | "LTF---" | "LTS---" | "P-----" | "PC----" | "PCB---" | "PCF---" | "PCH---" | "PCL---" | "PCR---" | "PCS---" | "PT----" | "PTN---" | "PTS---";
    GG: "------" | "A-----" | "AA----" | "AAF---" | "AAH---" | "AAM---" | "AAMH--" | "AAML--" | "AAR---" | "AAW---" | "AL----" | "ALC---" | "ALL---" | "ALM---" | "ALS---" | "ALU---" | "AP----" | "APC---" | "APD---" | "APP---" | "APU---" | "D-----" | "DA----" | "DAB---" | "DABP--" | "DAE---" | "DL----" | "DLF---" | "DLP---" | "DP----" | "DPO---" | "DPOC--" | "DPOF--" | "DPON--" | "DPOS--" | "DPT---" | "G-----" | "GA----" | "GAA---" | "GAD---" | "GAE---" | "GAF---" | "GAG---" | "GAL---" | "GAP---" | "GAS---" | "GAX---" | "GAY---" | "GAZ---" | "GL----" | "GLB---" | "GLC---" | "GLF---" | "GLL---" | "GLP---" | "GP----" | "GPA---" | "GPAA--" | "GPAB--" | "GPAC--" | "GPAD--" | "GPAE--" | "GPAF--" | "GPAG--" | "GPAH--" | "GPAI--" | "GPAJ--" | "GPAK--" | "GPAL--" | "GPAM--" | "GPAN--" | "GPAO--" | "GPAP--" | "GPAR--" | "GPAS--" | "GPAT--" | "GPAW--" | "GPB---" | "GPBS--" | "GPBSA-" | "GPBU--" | "GPBUA-" | "GPBUM-" | "GPBUS-" | "GPC---" | "GPCA--" | "GPCC--" | "GPCE--" | "GPCM--" | "GPCN--" | "GPCP--" | "GPCR--" | "GPCS--" | "GPCU--" | "GPCUA-" | "GPCUM-" | "GPCUS-" | "GPF---" | "GPH---" | "GPHA--" | "GPHQ--" | "GPHX--" | "GPHY--" | "GPO---" | "GPOD--" | "GPOP--" | "GPOR--" | "GPOW--" | "GPOZ--" | "GPP---" | "GPPA--" | "GPPC--" | "GPPD--" | "GPPE--" | "GPPK--" | "GPPL--" | "GPPO--" | "GPPP--" | "GPPR--" | "GPPS--" | "GPPW--" | "GPR---" | "GPRC--" | "GPRD--" | "GPRI--" | "GPRM--" | "GPRN--" | "GPRP--" | "GPRS--" | "GPRW--" | "GPU---" | "GPUS--" | "GPUSA-" | "GPUSC-" | "GPUSD-" | "GPUU--" | "GPUUB-" | "GPUUD-" | "GPUUL-" | "GPUUS-" | "GPUY--" | "GPUYA-" | "GPUYB-" | "GPUYC-" | "GPUYK-" | "GPUYL-" | "GPUYP-" | "GPUYR-" | "GPUYT-" | "GPUYV-" | "GPUYX-" | "GPW---" | "GPWA--" | "GPWD--" | "GPWE--" | "GPWG--" | "GPWI--" | "GPWM--" | "GPWP--" | "O-----" | "OA----" | "OAA---" | "OAF---" | "OAK---" | "OAO---" | "OAP---" | "OAS---" | "OL----" | "OLA---" | "OLAA--" | "OLAG--" | "OLAGM-" | "OLAGS-" | "OLAR--" | "OLAV--" | "OLC---" | "OLF---" | "OLI---" | "OLK---" | "OLKA--" | "OLKG--" | "OLKGM-" | "OLKGS-" | "OLL---" | "OLP---" | "OLT---" | "OP----" | "OPP---" | "P-----" | "PA----" | "PC----" | "PD----" | "PF----" | "PM----" | "PN----" | "PY----" | "S-----" | "SA----" | "SAA---" | "SAE---" | "SAN---" | "SAO---" | "SAT---" | "SL----" | "SLA---" | "SLB---" | "SLH---" | "SLR---";
    GM: "------" | "B-----" | "BC----" | "BCA---" | "BCB---" | "BCD---" | "BCE---" | "BCF---" | "BCL---" | "BCP---" | "BCR---" | "BD----" | "BDD---" | "BDE---" | "BDI---" | "N-----" | "NB----" | "NC----" | "ND----" | "NDA---" | "NDB---" | "NDD---" | "NDE---" | "NDO---" | "NDP---" | "NDT---" | "NE----" | "NEB---" | "NEC---" | "NF----" | "NL----" | "NM----" | "NR----" | "NZ----" | "O-----" | "OA----" | "OAD---" | "OADC--" | "OADU--" | "OAOF--" | "OAOM--" | "OAOP--" | "OAR---" | "OAW---" | "OB----" | "OE----" | "OEB---" | "OED---" | "OEF---" | "OET---" | "OF----" | "OFA---" | "OFD---" | "OFG---" | "OFS---" | "OG----" | "OGB---" | "OGF---" | "OGL---" | "OGR---" | "OGZ---" | "OH----" | "OHO---" | "OHT---" | "OHTH--" | "OHTL--" | "OM----" | "OMC---" | "OMD---" | "OME---" | "OMP---" | "OMT---" | "OMU---" | "OMW---" | "OR----" | "ORA---" | "ORC---" | "ORP---" | "ORS---" | "OS----" | "OT----" | "OU----" | "OW----" | "OWA---" | "OWC---" | "OWCD--" | "OWCS--" | "OWCT--" | "OWD---" | "OWH---" | "OWL---" | "OWS---" | "OWU---" | "S-----" | "SE----" | "SF----" | "SL----" | "SP----" | "SS----" | "SU----" | "SW----";
    GO: "------" | "B-----" | "BA----" | "BE----" | "BO----" | "BT----" | "E-----" | "ED----" | "EP----" | "EV----" | "F-----" | "FA----" | "FE----" | "FO----" | "H-----" | "HI----" | "HM----" | "HN----" | "HO----" | "S-----" | "SB----" | "SBM---" | "SBN---" | "SBW---" | "SBX---" | "SM----" | "SS----";
    GS: "------" | "A-----" | "AD----" | "AE----" | "AH----" | "AR----" | "AS----" | "ASB---" | "ASD---" | "ASR---" | "L-----" | "LC----" | "LCH---" | "LCM---" | "LR----" | "LRA---" | "LRM---" | "LRO---" | "LRT---" | "LRW---" | "P-----" | "PA----" | "PAS---" | "PAT---" | "PC----" | "PD----" | "PE----" | "PI----" | "PL----" | "PM----" | "PN----" | "PO----" | "PR----" | "PS----" | "PSA---" | "PSB---" | "PSC---" | "PSD---" | "PSE---" | "PSF---" | "PSG---" | "PSH---" | "PSI---" | "PSJ---" | "PSZ---" | "PT----" | "PU----" | "PX----" | "PY----";
    GT: "------" | "A-----" | "AS----" | "B-----" | "C-----" | "D-----" | "E-----" | "F-----" | "H-----" | "I-----" | "J-----" | "K-----" | "KF----" | "L-----" | "M-----" | "N-----" | "O-----" | "P-----" | "Q-----" | "R-----" | "S-----" | "T-----" | "U-----" | "UC----" | "UG----" | "US----" | "W-----" | "WP----" | "X-----" | "Y-----" | "Z-----";
    IA: "------" | "S-----" | "SC----" | "SCC---" | "SCO---" | "SCP---" | "SCS---" | "SR----" | "SRAI--" | "SRAS--" | "SRC---" | "SRD---" | "SRE---" | "SRF---" | "SRI---" | "SRMA--" | "SRMD--" | "SRMF--" | "SRMG--" | "SRMT--" | "SRTA--" | "SRTI--" | "SRTT--" | "SRU---";
    IG: "------" | "S-----" | "SC----" | "SCC---" | "SCO---" | "SCP---" | "SCS---" | "SCT---" | "SR----" | "SRAA--" | "SRAT--" | "SRB---" | "SRCA--" | "SRCS--" | "SRD---" | "SRE---" | "SRF---" | "SRH---" | "SRI---" | "SRMA--" | "SRMF--" | "SRMG--" | "SRMM--" | "SRMT--" | "SRS---" | "SRTA--" | "SRTI--" | "SRTT--" | "SRU---";
    IP: "------" | "S-----" | "SC----" | "SCD---" | "SR----" | "SRD---" | "SRE---" | "SRI---" | "SRM---" | "SRS---" | "SRT---" | "SRU---";
    IS: "------" | "S-----" | "SC----" | "SCC---" | "SCO---" | "SCP---" | "SCS---" | "SR----" | "SRAA--" | "SRAT--" | "SRCA--" | "SRCI--" | "SRD---" | "SRE---" | "SRF---" | "SRH---" | "SRI---" | "SRMA--" | "SRMF--" | "SRMG--" | "SRMM--" | "SRMT--" | "SRS---" | "SRTA--" | "SRTI--" | "SRTT--" | "SRU---";
    IU: "------" | "S-----" | "SC----" | "SCO---" | "SCP---" | "SCS---" | "SR----" | "SRD---" | "SRE---" | "SRM---" | "SRS---" | "SRT---" | "SRU---";
    OG: "------" | "A-----" | "B-----" | "C-----" | "D-----" | "E-----" | "F-----";
    OI: "------" | "AC----" | "D-----" | "F-----" | "G-----" | "I-----" | "R-----" | "S-----" | "V-----";
    OL: "------" | "B-----" | "G-----" | "M-----" | "W-----";
    OO: "------" | "A-----" | "C-----" | "CA----" | "CB----" | "CC----" | "D-----" | "E-----" | "F-----" | "H-----" | "HA----" | "HT----" | "HV----" | "K-----" | "KA----" | "M-----" | "O-----" | "P-----" | "R-----" | "RC----" | "RW----" | "S-----" | "U-----" | "Y-----" | "YH----" | "YT----" | "YW----";
    OP: "------" | "A-----" | "B-----" | "C-----";
    OR: "------" | "A-----";
    OV: "------" | "A-----" | "B-----" | "D-----" | "E-----" | "EI----" | "M-----" | "MA----" | "MB----" | "MC----" | "P-----" | "S-----" | "Y-----";
    SA: "------" | "C-----" | "CF----" | "CH----" | "CL----" | "M-----" | "ME----" | "MF----" | "MFA---" | "MFB---" | "MFC---" | "MFCH--" | "MFCL--" | "MFCM--" | "MFD---" | "MFF---" | "MFFI--" | "MFH---" | "MFJ---" | "MFK---" | "MFKB--" | "MFKD--" | "MFL---" | "MFM---" | "MFO---" | "MFP---" | "MFPM--" | "MFPN--" | "MFQ---" | "MFQA--" | "MFQB--" | "MFQC--" | "MFQD--" | "MFQF--" | "MFQH--" | "MFQI--" | "MFQJ--" | "MFQK--" | "MFQL--" | "MFQM--" | "MFQN--" | "MFQO--" | "MFQP--" | "MFQR--" | "MFQRW-" | "MFQRX-" | "MFQRZ-" | "MFQS--" | "MFQT--" | "MFQU--" | "MFQY--" | "MFR---" | "MFRW--" | "MFRX--" | "MFRZ--" | "MFS---" | "MFT---" | "MFU---" | "MFUH--" | "MFUL--" | "MFUM--" | "MFY---" | "MH----" | "MHA---" | "MHC---" | "MHCH--" | "MHCL--" | "MHCM--" | "MHD---" | "MHH---" | "MHI---" | "MHJ---" | "MHK---" | "MHM---" | "MHO---" | "MHQ---" | "MHR---" | "MHS---" | "MHT---" | "MHU---" | "MHUH--" | "MHUL--" | "MHUM--" | "ML----" | "MV----" | "W-----" | "WB----" | "WD----" | "WM----" | "WMA---" | "WMAA--" | "WMAP--" | "WMAS--" | "WMB---" | "WMCM--" | "WMS---" | "WMSA--" | "WMSB--" | "WMSS--" | "WMSU--" | "WMU---";
    SF: "------" | "A-----" | "AF----" | "AFA---" | "AFK---" | "AFU---" | "AFUH--" | "AFUL--" | "AFUM--" | "AH----" | "AHA---" | "AHH---" | "AHU---" | "AHUH--" | "AHUL--" | "AHUM--" | "AV----" | "B-----" | "G-----" | "GC----" | "GP----" | "GPA---" | "GR----" | "GS----" | "N-----" | "NB----" | "NN----" | "NS----" | "NU----";
    SG: "------" | "E-----" | "ES----" | "ESE---" | "ESR---" | "EV----" | "EVA---" | "EVAA--" | "EVAAR-" | "EVAC--" | "EVAI--" | "EVAL--" | "EVAS--" | "EVAT--" | "EVATH-" | "EVATHR" | "EVATL-" | "EVATLR" | "EVATM-" | "EVATMR" | "EVC---" | "EVCA--" | "EVCAH-" | "EVCAL-" | "EVCAM-" | "EVCF--" | "EVCFH-" | "EVCFL-" | "EVCFM-" | "EVCJ--" | "EVCJH-" | "EVCJL-" | "EVCJM-" | "EVCM--" | "EVCMH-" | "EVCML-" | "EVCMM-" | "EVCO--" | "EVCOH-" | "EVCOL-" | "EVCOM-" | "EVCT--" | "EVCTH-" | "EVCTL-" | "EVCTM-" | "EVCU--" | "EVCUH-" | "EVCUL-" | "EVCUM-" | "EVE---" | "EVEA--" | "EVEAA-" | "EVEAT-" | "EVEB--" | "EVEC--" | "EVED--" | "EVEDA-" | "EVEE--" | "EVEF--" | "EVEH--" | "EVEM--" | "EVEML-" | "EVEMV-" | "EVER--" | "EVES--" | "EVM---" | "EVS---" | "EVSC--" | "EVSP--" | "EVSR--" | "EVST--" | "EVSW--" | "EVT---" | "EVU---" | "EVUA--" | "EVUAA-" | "EVUB--" | "EVUL--" | "EVUR--" | "EVUS--" | "EVUSH-" | "EVUSL-" | "EVUSM-" | "EVUT--" | "EVUTH-" | "EVUTL-" | "EVUX--" | "EW----" | "EWA---" | "EWAH--" | "EWAL--" | "EWAM--" | "EWD---" | "EWDH--" | "EWDHS-" | "EWDL--" | "EWDLS-" | "EWDM--" | "EWDMS-" | "EWG---" | "EWGH--" | "EWGL--" | "EWGM--" | "EWGR--" | "EWH---" | "EWHH--" | "EWHHS-" | "EWHL--" | "EWHLS-" | "EWHM--" | "EWHMS-" | "EWM---" | "EWMA--" | "EWMAI-" | "EWMAIE" | "EWMAIR" | "EWMAL-" | "EWMALE" | "EWMALR" | "EWMAS-" | "EWMASE" | "EWMASR" | "EWMAT-" | "EWMATE" | "EWMATR" | "EWMS--" | "EWMSI-" | "EWMSL-" | "EWMSS-" | "EWMT--" | "EWMTH-" | "EWMTL-" | "EWMTM-" | "EWO---" | "EWOH--" | "EWOL--" | "EWOM--" | "EWR---" | "EWRH--" | "EWRL--" | "EWRR--" | "EWS---" | "EWSH--" | "EWSL--" | "EWSM--" | "EWT---" | "EWTH--" | "EWTL--" | "EWTM--" | "EWX---" | "EWXH--" | "EWXL--" | "EWXM--" | "EWZ---" | "EWZH--" | "EWZL--" | "EWZM--" | "EX----" | "EXF---" | "EXI---" | "EXL---" | "EXM---" | "EXMC--" | "EXML--" | "EXN---" | "I-----" | "IB----" | "IBA---" | "IBN---" | "IE----" | "IG----" | "IM----" | "IMA---" | "IMC---" | "IME---" | "IMF---" | "IMFA--" | "IMFP--" | "IMFPW-" | "IMFS--" | "IMG---" | "IMM---" | "IMN---" | "IMNB--" | "IMS---" | "IMV---" | "IP----" | "IPD---" | "IR----" | "IRM---" | "IRN---" | "IRNB--" | "IRNC--" | "IRNN--" | "IRP---" | "IT----" | "IU----" | "IUE---" | "IUED--" | "IUEF--" | "IUEN--" | "IUP---" | "IUR---" | "IUT---" | "IX----" | "IXH---" | "U-----" | "UC----" | "UCA---" | "UCAA--" | "UCAAA-" | "UCAAAS" | "UCAAAT" | "UCAAAW" | "UCAAC-" | "UCAAD-" | "UCAAL-" | "UCAAM-" | "UCAAO-" | "UCAAOS" | "UCAAS-" | "UCAAU-" | "UCAT--" | "UCATA-" | "UCATH-" | "UCATL-" | "UCATM-" | "UCATR-" | "UCATW-" | "UCATWR" | "UCAW--" | "UCAWA-" | "UCAWH-" | "UCAWL-" | "UCAWM-" | "UCAWR-" | "UCAWS-" | "UCAWW-" | "UCAWWR" | "UCD---" | "UCDC--" | "UCDG--" | "UCDH--" | "UCDHH-" | "UCDHP-" | "UCDM--" | "UCDMH-" | "UCDML-" | "UCDMLA" | "UCDMM-" | "UCDO--" | "UCDS--" | "UCDSC-" | "UCDSS-" | "UCDSV-" | "UCDT--" | "UCE---" | "UCEC--" | "UCECA-" | "UCECC-" | "UCECH-" | "UCECL-" | "UCECM-" | "UCECO-" | "UCECR-" | "UCECS-" | "UCECT-" | "UCECW-" | "UCEN--" | "UCENN-" | "UCF---" | "UCFH--" | "UCFHA-" | "UCFHC-" | "UCFHE-" | "UCFHH-" | "UCFHL-" | "UCFHM-" | "UCFHO-" | "UCFHS-" | "UCFHX-" | "UCFM--" | "UCFML-" | "UCFMS-" | "UCFMT-" | "UCFMTA" | "UCFMTC" | "UCFMTO" | "UCFMTS" | "UCFMW-" | "UCFO--" | "UCFOA-" | "UCFOL-" | "UCFOO-" | "UCFOS-" | "UCFR--" | "UCFRM-" | "UCFRMR" | "UCFRMS" | "UCFRMT" | "UCFRS-" | "UCFRSR" | "UCFRSS" | "UCFRST" | "UCFS--" | "UCFSA-" | "UCFSL-" | "UCFSO-" | "UCFSS-" | "UCFT--" | "UCFTA-" | "UCFTC-" | "UCFTCD" | "UCFTCM" | "UCFTF-" | "UCFTR-" | "UCFTS-" | "UCI---" | "UCIA--" | "UCIC--" | "UCII--" | "UCIL--" | "UCIM--" | "UCIN--" | "UCIO--" | "UCIS--" | "UCIZ--" | "UCM---" | "UCMS--" | "UCMT--" | "UCR---" | "UCRA--" | "UCRC--" | "UCRH--" | "UCRL--" | "UCRO--" | "UCRR--" | "UCRRD-" | "UCRRF-" | "UCRS--" | "UCRV--" | "UCRVA-" | "UCRVG-" | "UCRVM-" | "UCRVO-" | "UCRX--" | "UCS---" | "UCSA--" | "UCSG--" | "UCSGA-" | "UCSGD-" | "UCSGM-" | "UCSM--" | "UCSR--" | "UCSW--" | "UCV---" | "UCVC--" | "UCVF--" | "UCVFA-" | "UCVFR-" | "UCVFU-" | "UCVR--" | "UCVRA-" | "UCVRM-" | "UCVRS-" | "UCVRU-" | "UCVRUC" | "UCVRUE" | "UCVRUH" | "UCVRUL" | "UCVRUM" | "UCVRW-" | "UCVS--" | "UCVU--" | "UCVUF-" | "UCVUR-" | "UH----" | "US----" | "USA---" | "USAC--" | "USAF--" | "USAFC-" | "USAFT-" | "USAJ--" | "USAJC-" | "USAJT-" | "USAL--" | "USALC-" | "USALT-" | "USAM--" | "USAMC-" | "USAMT-" | "USAO--" | "USAOC-" | "USAOT-" | "USAP--" | "USAPB-" | "USAPBC" | "USAPBT" | "USAPC-" | "USAPM-" | "USAPMC" | "USAPMT" | "USAPT-" | "USAQ--" | "USAQC-" | "USAQT-" | "USAR--" | "USARC-" | "USART-" | "USAS--" | "USASC-" | "USAST-" | "USAT--" | "USAW--" | "USAWC-" | "USAWT-" | "USAX--" | "USAXC-" | "USAXT-" | "USM---" | "USMC--" | "USMD--" | "USMDC-" | "USMDT-" | "USMM--" | "USMMC-" | "USMMT-" | "USMP--" | "USMPC-" | "USMPT-" | "USMT--" | "USMV--" | "USMVC-" | "USMVT-" | "USS---" | "USS1--" | "USS1C-" | "USS1T-" | "USS2--" | "USS2C-" | "USS2T-" | "USS3--" | "USS3A-" | "USS3AC" | "USS3AT" | "USS3C-" | "USS3T-" | "USS4--" | "USS4C-" | "USS4T-" | "USS5--" | "USS5C-" | "USS5T-" | "USS6--" | "USS6C-" | "USS6T-" | "USS7--" | "USS7C-" | "USS7T-" | "USS8--" | "USS8C-" | "USS8T-" | "USS9--" | "USS9C-" | "USS9T-" | "USSC--" | "USSL--" | "USSLC-" | "USSLT-" | "USST--" | "USSW--" | "USSWC-" | "USSWP-" | "USSWPC" | "USSWPT" | "USSWT-" | "USSX--" | "USSXC-" | "USSXT-" | "UST---" | "USTA--" | "USTAC-" | "USTAT-" | "USTC--" | "USTI--" | "USTIC-" | "USTIT-" | "USTM--" | "USTMC-" | "USTMT-" | "USTR--" | "USTRC-" | "USTRT-" | "USTS--" | "USTSC-" | "USTST-" | "USTT--" | "USX---" | "USXC--" | "USXE--" | "USXEC-" | "USXET-" | "USXH--" | "USXHC-" | "USXHT-" | "USXO--" | "USXOC-" | "USXOM-" | "USXOMC" | "USXOMT" | "USXOT-" | "USXR--" | "USXRC-" | "USXRT-" | "USXT--" | "UU----" | "UUA---" | "UUAB--" | "UUABR-" | "UUAC--" | "UUACC-" | "UUACCK" | "UUACCM" | "UUACR-" | "UUACRW" | "UUACS-" | "UUACSA" | "UUACSM" | "UUAD--" | "UUAN--" | "UUE---" | "UUI---" | "UUL---" | "UULC--" | "UULD--" | "UULF--" | "UULM--" | "UULS--" | "UUM---" | "UUMA--" | "UUMC--" | "UUMJ--" | "UUMMO-" | "UUMO--" | "UUMQ--" | "UUMR--" | "UUMRG-" | "UUMRS-" | "UUMRSS" | "UUMRX-" | "UUMS--" | "UUMSE-" | "UUMSEA" | "UUMSEC" | "UUMSED" | "UUMSEI" | "UUMSEJ" | "UUMSET" | "UUMT--" | "UUP---" | "UUS---" | "UUSA--" | "UUSC--" | "UUSCL-" | "UUSF--" | "UUSM--" | "UUSML-" | "UUSMN-" | "UUSMS-" | "UUSO--" | "UUSR--" | "UUSRS-" | "UUSRT-" | "UUSRW-" | "UUSS--" | "UUSW--" | "UUSX--";
    SP: "------" | "L-----" | "S-----" | "T-----" | "V-----";
    SS: "------" | "C-----" | "CA----" | "CALA--" | "CALC--" | "CALS--" | "CALSM-" | "CALST-" | "CD----" | "CH----" | "CL----" | "CLBB--" | "CLCC--" | "CLCV--" | "CLDD--" | "CLFF--" | "CLLL--" | "CLLLAS" | "CLLLMI" | "CLLLSU" | "CM----" | "CMMA--" | "CMMH--" | "CMML--" | "CMMS--" | "CP----" | "CPSB--" | "CPSU--" | "CPSUG-" | "CPSUM-" | "CPSUT-" | "CU----" | "CUM---" | "CUN---" | "CUR---" | "CUS---" | "G-----" | "GC----" | "GG----" | "GT----" | "GU----" | "N-----" | "NF----" | "NH----" | "NI----" | "NM----" | "NR----" | "NS----" | "O-----" | "X-----" | "XA----" | "XAR---" | "XAS---" | "XF----" | "XFDF--" | "XFDR--" | "XFTR--" | "XH----" | "XL----" | "XM----" | "XMC---" | "XMF---" | "XMH---" | "XMO---" | "XMP---" | "XMR---" | "XMTO--" | "XMTU--" | "XP----" | "XR----";
    SU: "------" | "E-----" | "N-----" | "ND----" | "S-----" | "S1----" | "S2----" | "S3----" | "S4----" | "SB----" | "SC----" | "SCA---" | "SCB---" | "SCF---" | "SCG---" | "SCM---" | "SF----" | "SK----" | "SL----" | "SN----" | "SNA---" | "SNB---" | "SNF---" | "SNG---" | "SNM---" | "SO----" | "SOF---" | "SR----" | "SU----" | "SUM---" | "SUN---" | "SUS---" | "SX----" | "V-----" | "W-----" | "WD----" | "WDM---" | "WDMG--" | "WDMM--" | "WM----" | "WMA---" | "WMB---" | "WMBD--" | "WMC---" | "WMD---" | "WME---" | "WMF---" | "WMFC--" | "WMFD--" | "WMFE--" | "WMFO--" | "WMFR--" | "WMFX--" | "WMG---" | "WMGC--" | "WMGD--" | "WMGE--" | "WMGO--" | "WMGR--" | "WMGX--" | "WMM---" | "WMMC--" | "WMMD--" | "WMME--" | "WMMO--" | "WMMR--" | "WMMX--" | "WMN---" | "WMO---" | "WMOD--" | "WMR---" | "WMS---" | "WMSD--" | "WMSX--" | "WMX---" | "WT----" | "X-----";
}
/** Complete METOC SIDCs (no user-defined positions). */
type MetocSidc = "W--------------" | "WA-------------" | "WA--BA---------" | "WA--CC---------" | "WA--CCCS-------" | "WA--I----------" | "WA--IP---------" | "WA--P----------" | "WA--PX---------" | "WA--T----------" | "WA--W----------" | "WA--WS---------" | "WA-DBAD-----A--" | "WA-DBAFF----A--" | "WA-DBAFG----A--" | "WA-DBAFP----A--" | "WA-DBAI-----A--" | "WA-DBAIF----A--" | "WA-DBALPC---A--" | "WA-DBAMV----A--" | "WA-DBAT-----A--" | "WA-DBATB----A--" | "WA-DIPCO---L---" | "WA-DIPFF---L---" | "WA-DIPIB---L---" | "WA-DIPID---L---" | "WA-DIPIS---L---" | "WA-DIPIT---L---" | "WA-DIPTH---L---" | "WA-DPF-----L---" | "WA-DPFC----L---" | "WA-DPFC-FG-L---" | "WA-DPFC-FY-L---" | "WA-DPFCU---L---" | "WA-DPFO----L---" | "WA-DPFO-FY-L---" | "WA-DPFOU---L---" | "WA-DPFS----L---" | "WA-DPFS-FG-L---" | "WA-DPFS-FY-L---" | "WA-DPFSU---L---" | "WA-DPFW----L---" | "WA-DPFW-FG-L---" | "WA-DPFW-FY-L---" | "WA-DPFWU---L---" | "WA-DPXCV---L---" | "WA-DPXIL---L---" | "WA-DPXITCZ-L---" | "WA-DPXITD--L---" | "WA-DPXR----L---" | "WA-DPXSH---L---" | "WA-DPXSQ---L---" | "WA-DPXT----L---" | "WA-DWJ-----L---" | "WA-DWS-----L---" | "WA-DWSTSWA--A--" | "WAS-CCCSBCP----" | "WAS-CCCSCSP----" | "WAS-CCCSFCP----" | "WAS-CCCSOBP----" | "WAS-CCCSOCP----" | "WAS-CCCSSCP----" | "WAS-G----------" | "WAS-GN---------" | "WAS-GNDEWCP----" | "WAS-GNFL--P----" | "WAS-GNFZ--P----" | "WAS-GNG-TIP----" | "WAS-GNM---P----" | "WAS-GNW-SWP----" | "WAS-GS---------" | "WAS-GSI---P----" | "WAS-GSSCH-P----" | "WAS-GSSDC-P----" | "WAS-GSSLL-P----" | "WAS-IC----P----" | "WAS-ICL---P----" | "WAS-ICM---P----" | "WAS-ICS---P----" | "WAS-IM----P----" | "WAS-IML---P----" | "WAS-IMM---P----" | "WAS-IMS---P----" | "WAS-IR----P----" | "WAS-IRL---P----" | "WAS-IRM---P----" | "WAS-IRS---P----" | "WAS-PA----P----" | "WAS-PC----P----" | "WAS-PH----P----" | "WAS-PHT---P----" | "WAS-PL----P----" | "WAS-PLT---P----" | "WAS-T-MW--P----" | "WAS-TE----P----" | "WAS-TL----P----" | "WAS-TM----P----" | "WAS-TS----P----" | "WAS-WC----P----" | "WAS-WP----P----" | "WAS-WSBR--P----" | "WAS-WSD--------" | "WAS-WSD-HCP----" | "WAS-WSD-HIP----" | "WAS-WSD-LCP----" | "WAS-WSD-LIP----" | "WAS-WSD-MCP----" | "WAS-WSD-MIP----" | "WAS-WSDB--P----" | "WAS-WSDD--P----" | "WAS-WSDF-------" | "WAS-WSDFL-P----" | "WAS-WSDFMHP----" | "WAS-WSDSLMP----" | "WAS-WSDSS-P----" | "WAS-WSF-LVP----" | "WAS-WSFG-------" | "WAS-WSFGCSP----" | "WAS-WSFGFOP----" | "WAS-WSFGFVP----" | "WAS-WSFGP-P----" | "WAS-WSFGPSP----" | "WAS-WSFGSOP----" | "WAS-WSFGSVP----" | "WAS-WSFU--P----" | "WAS-WSGR-------" | "WAS-WSGRL-P----" | "WAS-WSGRMHP----" | "WAS-WSHZ--P----" | "WAS-WSIC--P----" | "WAS-WSM--------" | "WAS-WSM-L-P----" | "WAS-WSM-MHP----" | "WAS-WSMSL-P----" | "WAS-WSMSMHP----" | "WAS-WSPL-------" | "WAS-WSPLH-P----" | "WAS-WSPLL-P----" | "WAS-WSPLM-P----" | "WAS-WSR--------" | "WAS-WSR-HCP----" | "WAS-WSR-HIP----" | "WAS-WSR-LCP----" | "WAS-WSR-LIP----" | "WAS-WSR-MCP----" | "WAS-WSR-MIP----" | "WAS-WSRF-------" | "WAS-WSRFL-P----" | "WAS-WSRFMHP----" | "WAS-WSRS-------" | "WAS-WSRSL-P----" | "WAS-WSRSMHP----" | "WAS-WSRST-P----" | "WAS-WSS--------" | "WAS-WSS-HCP----" | "WAS-WSS-HIP----" | "WAS-WSS-LCP----" | "WAS-WSS-LIP----" | "WAS-WSS-MCP----" | "WAS-WSS-MIP----" | "WAS-WSSBH-P----" | "WAS-WSSBLMP----" | "WAS-WSSG--P----" | "WAS-WSSS-------" | "WAS-WSSSL-P----" | "WAS-WSSSMHP----" | "WAS-WST--------" | "WAS-WST-FCP----" | "WAS-WST-LGP----" | "WAS-WST-LVP----" | "WAS-WST-NPP----" | "WAS-WST-SQP----" | "WAS-WSTHH-P----" | "WAS-WSTHR-P----" | "WAS-WSTMH-P----" | "WAS-WSTS-------" | "WAS-WSTSD-P----" | "WAS-WSTSH-P----" | "WAS-WSTSS-P----" | "WAS-WSUKP-P----" | "WAS-WSVA--P----" | "WAS-WSVE--P----" | "WO-------------" | "WO--BF---------" | "WO--BS---------" | "WO--G----------" | "WO--GM---------" | "WO--GMBC-------" | "WO--GMBT-------" | "WO--GMC--------" | "WO--GMIB-------" | "WO--GMR--------" | "WO--GMS--------" | "WO--H----------" | "WO--HA---------" | "WO--HC---------" | "WO--HD---------" | "WO--HH---------" | "WO--HPF--------" | "WO--HPM--------" | "WO--HPP--------" | "WO--I----------" | "WO--IC---------" | "WO--ID---------" | "WO--IL---------" | "WO--IO---------" | "WO--IT---------" | "WO--L----------" | "WO--M----------" | "WO--O----------" | "WO--OB---------" | "WO--TCC--------" | "WO-DBSF-----A--" | "WO-DBSG-----A--" | "WO-DBSM-----A--" | "WO-DBST-----A--" | "WO-DGMBCA---A--" | "WO-DGMBCB---A--" | "WO-DGMBCC---A--" | "WO-DGMBTA---A--" | "WO-DGMBTB---A--" | "WO-DGMBTC---A--" | "WO-DGMBTD---A--" | "WO-DGMBTE---A--" | "WO-DGMBTF---A--" | "WO-DGMBTG---A--" | "WO-DGMBTH---A--" | "WO-DGMBTI---A--" | "WO-DGMCH----A--" | "WO-DGMCL----A--" | "WO-DGMCM----A--" | "WO-DGMIBA---A--" | "WO-DGMIBB---A--" | "WO-DGMIBC---A--" | "WO-DGMIBD---A--" | "WO-DGMIBE---A--" | "WO-DGML-----A--" | "WO-DGMN-----A--" | "WO-DGMRM----A--" | "WO-DGMRR----A--" | "WO-DGMRS----A--" | "WO-DGMS-CO--A--" | "WO-DGMS-PH--A--" | "WO-DGMS-SH--A--" | "WO-DGMSB----A--" | "WO-DGMSC----A--" | "WO-DGMSIC---A--" | "WO-DGMSIF---A--" | "WO-DGMSIM---A--" | "WO-DGMSIVF--A--" | "WO-DGMSR----A--" | "WO-DGMSSC---A--" | "WO-DGMSSF---A--" | "WO-DGMSSM---A--" | "WO-DGMSSVF--A--" | "WO-DGMSSVS--A--" | "WO-DHABP----A--" | "WO-DHALLA--L---" | "WO-DHCB-----A--" | "WO-DHCC----L---" | "WO-DHCF--------" | "WO-DHCF-----A--" | "WO-DHCF----L---" | "WO-DHCI-----A--" | "WO-DHCW-----A--" | "WO-DHDDA----A--" | "WO-DHDDC---L---" | "WO-DHDDL---L---" | "WO-DHHD-----A--" | "WO-DHHDB---L---" | "WO-DHHDD----A--" | "WO-DHHDF----A--" | "WO-DHHDK-------" | "WO-DHHDK----A--" | "WO-DHHDK--P----" | "WO-DHP---------" | "WO-DHPBA----A--" | "WO-DHPBA---L---" | "WO-DHPBP---L---" | "WO-DHPMD----A--" | "WO-DHPMO----A--" | "WO-DHPMO---L---" | "WO-DHPMO--P----" | "WO-DHPMRA--L---" | "WO-DHPMRB--L---" | "WO-DHPSPA--L---" | "WO-DHPSPB--L---" | "WO-DHPSPS--L---" | "WO-DIDID---L---" | "WO-DILIEE--L---" | "WO-DILIEO--L---" | "WO-DILIER--L---" | "WO-DILOR---L---" | "WO-DILOV---L---" | "WO-DILUC---L---" | "WO-DIOC----L---" | "WO-DIOCS---L---" | "WO-DIOL----L---" | "WO-DIOLF---L---" | "WO-DL-MA----A--" | "WO-DL-ML---L---" | "WO-DL-O-----A--" | "WO-DL-RA---L---" | "WO-DL-SA----A--" | "WO-DL-TA----A--" | "WO-DMCA----L---" | "WO-DMCC-----A--" | "WO-DMCD----L---" | "WO-DMOA-----A--" | "WO-DMPA----L---" | "WO-DOBVA----A--" | "WO-DOBVB----A--" | "WO-DOBVC----A--" | "WO-DOBVD----A--" | "WO-DOBVE----A--" | "WO-DOBVF----A--" | "WO-DOBVG----A--" | "WO-DOBVH----A--" | "WO-DOBVI----A--" | "WO-DTCCCFE-L---" | "WO-DTCCCFF-L---" | "WOS-BFC--------" | "WOS-BFC-CBP----" | "WOS-BFC-CLP----" | "WOS-BFC-COP----" | "WOS-BFC-G-P----" | "WOS-BFC-M-P----" | "WOS-BFC-P-P----" | "WOS-BFC-R-P----" | "WOS-BFC-S-P----" | "WOS-BFC-SHP----" | "WOS-BFC-SIP----" | "WOS-BFC-STP----" | "WOS-BFQ--------" | "WOS-BFQ-C-P----" | "WOS-BFQ-F-P----" | "WOS-BFQ-M-P----" | "WOS-HABA--P----" | "WOS-HABB--P----" | "WOS-HABM--P----" | "WOS-HABP-------" | "WOS-HABP--P----" | "WOS-HAL---P----" | "WOS-HALH--P----" | "WOS-HALV--P----" | "WOS-HDS---P----" | "WOS-HHDE--P----" | "WOS-HHDF-------" | "WOS-HHDF--P----" | "WOS-HHDMD------" | "WOS-HHDMDBP----" | "WOS-HHDMDFP----" | "WOS-HHDR---L---" | "WOS-HHDS--P----" | "WOS-HHDWA------" | "WOS-HHDWA-P----" | "WOS-HHDWB-P----" | "WOS-HHRA--P----" | "WOS-HHRS--P----" | "WOS-HPB--------" | "WOS-HPB-A-P----" | "WOS-HPB-O-P----" | "WOS-HPBA--P----" | "WOS-HPCP--P----" | "WOS-HPD---P----" | "WOS-HPFF----A--" | "WOS-HPFH--P----" | "WOS-HPFS---L---" | "WOS-HPFS--P----" | "WOS-HPM-CC-L---" | "WOS-HPM-FC-L---" | "WOS-HPM-R-P----" | "WOS-HPML--P----" | "WOS-IB----P----" | "WOS-IBBB--P----" | "WOS-IBBBM-P----" | "WOS-IBBS--P----" | "WOS-IBF---P----" | "WOS-IBG---P----" | "WOS-IBGL--P----" | "WOS-IBGLM-P----" | "WOS-IBII--P----" | "WOS-IBM---P----" | "WOS-IBMG--P----" | "WOS-ICIF--P----" | "WOS-ICWB--P----" | "WOS-ICWR--P----" | "WOS-IDC---P----" | "WOS-IDD---P----" | "WOS-IDS---P----" | "WOS-II----P----" | "WOS-IIP---P----" | "WOS-IITE--P----" | "WOS-IITM--P----" | "WOS-ISC---P----" | "WOS-ISS---P----" | "WOS-ITBB--P----" | "WOS-ITR---P----" | "WOS-ITRH--P----" | "WOS-MF----P----" | "WOS-ML----P----" | "WOS-MOA---P----" | "WOS-MPA---P----" | "WOS-TCCTD-P----" | "WOS-TCCTG-P----" | "WOS-TCCW--P----" | "WS-------------";

/**
 * Compile-time checking of SIDC string literals.
 *
 * Functions that take a SIDC (`convertSidc`, `useSidcConverter`, ...) check string literals
 * against the MIL-STD-2525C tables at the type level. A bad literal is a type error whose
 * message names the position and the reason:
 *
 *   convertSidc("SHGPUCX--------");
 *   // Argument of type '"SHGPUCX--------"' is not assignable to parameter of type
 *   // '"✗ SIDC position 7: \"UCX---\" is not a 2525C function ID for scheme S, dimension G"'.
 *
 * Only literals are checked; a `string` (from data, forms, ...) passes and is validated at
 * runtime as before. Opting out:
 * - per call: pass a `string`, e.g. `convertSidc(code as string)`;
 * - everywhere: augment `TypeOptions` once in your project:
 *
 *     declare module "mil-symbol-converter" {
 *       interface TypeOptions { checkSidcLiterals: false }
 *     }
 *
 * The check is stricter than the runtime: it wants the canonical form (uppercase ASCII, no
 * typographic dashes or surrounding whitespace) that a literal in source code should have.
 */

/** Augment with `{ checkSidcLiterals: false }` to turn the literal check off project-wide. */
interface TypeOptions {
}
type CheckEnabled = TypeOptions extends {
    checkSidcLiterals: false;
} ? false : true;
type Upper = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";
type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type Err<P extends string | number, M extends string> = `✗ SIDC ${P extends `${string}-${string}` ? "positions" : "position"} ${P}: ${M}`;
type Length<S extends string, N extends 0[] = []> = S extends `${string}${infer R}` ? Length<R, [...N, 0]> : N["length"];
/** Only built for the error message, so valid literals never pay for counting. */
type LengthError<S extends string> = `✗ SIDC: a 2525C SIDC has 15 characters, "${S}" has ${Length<S>}`;
type AllDigits<S extends string> = S extends `${Digit}${infer R}` ? AllDigits<R> : S extends "" ? true : false;
/** Position (5-10) of the first function-ID character no listed ID continues. */
type FirstBadFn<F extends string, U extends string, Acc extends string = "", P extends number[] = [5, 6, 7, 8, 9, 10]> = F extends `${infer C}${infer R}` ? [Extract<U, `${Acc}${C}${string}`>] extends [never] ? P[0] : P extends [number, ...infer Rest extends number[]] ? FirstBadFn<R, U, `${Acc}${C}`, Rest> : 10 : 10;
type Wild<C extends string> = C | "*";
type CheckLetterSidc<S extends string> = S extends `${infer Sc}${infer Af}${infer Di}${infer St}${infer F1}${infer F2}${infer F3}${infer F4}${infer F5}${infer F6}${infer M1}${infer M2}${infer C1}${infer C2}${infer Ob}${infer Rest}` ? Rest extends "" ? Sc extends keyof SchemeTables ? Af extends Wild<AffiliationChar> ? Di extends SchemeTables[Sc]["dimension"] ? St extends Wild<SchemeTables[Sc]["status"]> ? `${F1}${F2}${F3}${F4}${F5}${F6}` extends FunctionIds[`${Sc}${Di}` & keyof FunctionIds] ? `${M1}${M2}` extends SchemeTables[Sc]["modifier"] | `*${string}` | `${string}*` ? `${C1}${C2}` extends `${Upper}${Upper}` | "--" | "**" | `*${string}` | `${string}*` ? Ob extends Wild<SchemeTables[Sc]["orderOfBattle"]> | "-" ? true : Err<15, `"${Ob}" is not an order of battle for scheme ${Sc}`> : Err<C1 extends Upper ? 14 : 13, `country code "${C1}${C2}" must be two letters, "--" or "**"`> : Err<`${M1}-` extends SchemeTables[Sc]["modifier"] ? 12 : `-${M2}` extends SchemeTables[Sc]["modifier"] ? 11 : "11-12", `"${M1}${M2}" is not a symbol modifier for scheme ${Sc}`> : Err<FirstBadFn<`${F1}${F2}${F3}${F4}${F5}${F6}`, FunctionIds[`${Sc}${Di}` & keyof FunctionIds]>, `"${F1}${F2}${F3}${F4}${F5}${F6}" is not a 2525C function ID for scheme ${Sc}, dimension ${Di}`> : Err<4, `"${St}" is not a status for scheme ${Sc}`> : Err<3, `"${Di}" is not a dimension/category for scheme ${Sc}`> : Err<2, `"${Af}" is not a standard identity`> : Sc extends "W" ? S extends MetocSidc ? true : Err<"5-15", `"${S}" is not a 2525C METOC SIDC`> : Err<1, `"${Sc}" is not a coding scheme (S, G, W, I, O, E)`> : LengthError<S> : LengthError<S>;
type HeaderKey = {
    [Sc in keyof SchemeTables]: `${Sc}${Wild<AffiliationChar>}${SchemeTables[Sc]["dimension"]}${Wild<SchemeTables[Sc]["status"]>}`;
}[keyof SchemeTables];
type FnKey = {
    [K in keyof FunctionIds]: `${K}${FunctionIds[K]}`;
}[keyof FunctionIds];
type ModKey = {
    [Sc in keyof SchemeTables]: `${Sc}${SchemeTables[Sc]["modifier"]}`;
}[keyof SchemeTables];
type ObKey = {
    [Sc in keyof SchemeTables]: `${Sc}${Wild<SchemeTables[Sc]["orderOfBattle"]> | "-"}`;
}[keyof SchemeTables];
type CountryKey = `${Upper}${Upper}` | "--" | "**";
/**
 * Every valid field of a letter SIDC, each tagged with a letter so one union holds them all:
 * a literal is checked with a single comparison of its (at most six) tagged fields against it.
 * A union of string literals tested against a union is a lookup per member, while a tuple
 * comparison resolves the members of each new tuple type (all of `Array`), which dominated.
 */
type FieldKey = "r" | `h${HeaderKey}` | `f${FnKey}` | `m${ModKey}` | `m${string}*${string}` | `c${CountryKey}` | `c${string}*${string}` | `o${ObKey}`;
/** `true` for a valid 15-character letter SIDC, else `false` (no message: see CheckLetterSidc). */
type IsValidLetterSidc<S extends string> = S extends `${infer Sc}${infer Af}${infer Di}${infer St}${infer F1}${infer F2}${infer F3}${infer F4}${infer F5}${infer F6}${infer M1}${infer M2}${infer C1}${infer C2}${infer Ob}${infer Rest}` ? `r${Rest}` | `h${Sc}${Af}${Di}${St}` | `f${Sc}${Di}${F1}${F2}${F3}${F4}${F5}${F6}` | `m${Sc}${M1}${M2}` | `c${C1}${C2}` | `o${Sc}${Ob}` extends FieldKey ? true : false : false;
/**
 * `true` for a valid SIDC literal (15-character 2525C, or a 20/30-digit numeric code, which is
 * checked at runtime), otherwise the error message as a string literal type.
 */
type ValidateSidcLiteral<S extends string> = S extends `${Digit}${string}` ? AllDigits<S> extends true ? Length<S> extends 20 | 30 ? true : `✗ SIDC: a numeric SIDC has 20 or 30 digits, "${S}" has ${Length<S>}` : LengthError<S> : S extends MetocSidc ? true : IsValidLetterSidc<S> extends true ? true : CheckLetterSidc<S>;
/** True for a fully known string literal; false for `string` and patterns like `S${string}`. */
type IsLiteral<S extends string> = {} extends Record<S, 1> ? false : true;
/**
 * Parameter type of SIDC inputs: a valid literal passes as itself, a bad literal becomes the
 * error message (so the compiler shows it), anything that is not a literal passes unchanged.
 *
 * Cost per checked literal matters (every call site pays it), so:
 * - valid letter SIDCs, the common case, are accepted by IsValidLetterSidc alone; whatever it
 *   accepts is a valid literal or not a literal, and both pass unchanged anyway;
 * - the error type is wrapped in an indexed access, which type-argument inference does not
 *   descend into (otherwise it walks every branch and message template of the validation for
 *   each call). It evaluates to the plain message once `S` is known.
 */
type CheckedSidc<S> = CheckEnabled extends false ? S : S extends string ? IsValidLetterSidc<S> extends true ? S : IsLiteral<S> extends false ? S : ValidateSidcLiteral<S> extends true ? S : {
    error: ValidateSidcLiteral<S>;
}[S extends S ? "error" : never] : S;
/** Identity function that checks a SIDC literal at compile time: `const s = sidc("SHGPUCI--------")`. */
declare function sidc<const S extends string>(value: CheckedSidc<S>): S;

/**
 * 15-character MIL-STD-2525C SIDC -> 12-character letter form.
 *
 * No standard defines a 12-character SIDC: MIL-STD-2525B/C (A.5.2) and APP-6(A)/(B) define 15
 * characters. The 12-character form is a library convention: milsymbol (src/lettersidc/
 * metadata.js) reads positions 1-12 and ignores 13-15 (country code and order of battle), and
 * @orbat-mapper/convert-symbology reads positions 1-12 and accepts 12-character input. This module
 * implements exactly that convention as the named profile "prefix-12" and nothing more; it is a
 * truncation, not a semantic conversion between standards.
 */

interface Legacy12Profile {
    name: string;
    description: string;
    /** References that document consumers of this form. */
    references: string[];
}
declare const LEGACY12_PROFILES: Record<string, Legacy12Profile>;
declare function convertSidc15To12(input: unknown, options?: ConversionOptions): ConversionResult;

/** 15-character MIL-STD-2525C -> 20-digit MIL-STD-2525D (version 10, or 11 with mil2525dVersion). */
declare function convertSidc15To2525D<const S>(input: CheckedSidc<S>, options?: ConversionOptions): ConversionResult;
/** 15-character MIL-STD-2525C -> 20-digit APP-6(D) (version 10). */
declare function convertSidc15ToApp6D<const S>(input: CheckedSidc<S>, options?: ConversionOptions): ConversionResult;
/** 15-character MIL-STD-2525C -> 20-digit MIL-STD-2525E Change 1 (version 15). */
declare function convertSidc15To2525E<const S>(input: CheckedSidc<S>, options?: ConversionOptions): ConversionResult;
/** 15-character MIL-STD-2525C -> 20-digit APP-6(E) Change 2 (version 16). */
declare function convertSidc15ToApp6E<const S>(input: CheckedSidc<S>, options?: ConversionOptions): ConversionResult;

/**
 * Converts a MIL-STD-2525C SIDC to `options.targetStandard` (default MIL-STD-2525D).
 */
declare function convertSidc<const S>(input: CheckedSidc<S>, options?: ConversionOptions): ConversionResult;
declare const ALL_TARGETS: readonly SidcStandard[];
/** Converts to every target; each result stands on its own. */
declare function convertSidcToAll<const S>(input: CheckedSidc<S>, options?: Omit<ConversionOptions, "targetStandard">): Record<string, ConversionResult>;

interface ReverseOptions {
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
declare const convertNumericTo2525C: (input: unknown, options?: ReverseOptions) => ConversionResult;

/** Catalog keys of the editions whose names we can check codes against. */
type EditionKey = "2525D" | "2525Dch1" | "APP-6D" | "2525Ech1" | "APP-6Ech2";
declare const SYMBOL_SET_NAMES: Record<string, string>;

/**
 * Mapping evidence adapters.
 *
 * The converter never talks to a dataset directly; it asks every registered adapter for the
 * 2525C -> numeric evidence it holds for a SIDC. Each adapter reports what its source says and
 * which edition that answer is native to. Swapping or adding a source (for example another
 * open-source converter) means implementing this interface, not changing the converter.
 */

interface MappingEvidence {
    source: MappingSourceName;
    /** Catalog edition whose names define the meaning of this answer. */
    nativeEdition: EditionKey;
    /** SIDC version digits the source assigns to the answer. */
    version: string;
    /** The source's template that matched the input. */
    template: string;
    /** The source says the 2525C symbol has no counterpart (retired). */
    retired: boolean;
    symbolSet: string;
    entity: string;
    m1: string;
    m2: string;
    /**
     * Number of distinct 2525C symbols this source maps to the same numeric code. More than one
     * means the target merged a 2525C distinction.
     */
    fanIn: number;
    /** Among merged symbols, this one is the source's primary (labelled) symbol. */
    canonical: boolean;
}
interface MappingAdapter {
    readonly name: MappingSourceName;
    readonly description: string;
    lookup(sidc: string): MappingEvidence[];
}
declare const jmsmlAdapter: MappingAdapter;
declare const milsymAdapter: MappingAdapter;
declare const defaultAdapters: readonly MappingAdapter[];

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

interface NumericTarget {
    standard: Extract<SidcStandard, "MIL-STD-2525D" | "MIL-STD-2525E" | "APP-6D" | "APP-6E">;
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
declare const NUMERIC_TARGETS: {
    readonly "2525D": {
        readonly standard: "MIL-STD-2525D";
        readonly version: "10";
        readonly edition: "2525D";
        readonly label: "MIL-STD-2525D (version 10)";
    };
    readonly "2525Dch1": {
        readonly standard: "MIL-STD-2525D";
        readonly version: "11";
        readonly edition: "2525Dch1";
        readonly label: "MIL-STD-2525D Change 1 (version 11)";
    };
    readonly "APP-6D": {
        readonly standard: "APP-6D";
        readonly version: "10";
        readonly edition: "APP-6D";
        readonly label: "APP-6(D) (version 10)";
    };
    readonly "2525E": {
        readonly standard: "MIL-STD-2525E";
        readonly version: "15";
        readonly edition: "2525Ech1";
        readonly label: "MIL-STD-2525E Change 1 (version 15)";
    };
    readonly "APP-6E": {
        readonly standard: "APP-6E";
        readonly version: "16";
        readonly edition: "APP-6Ech2";
        readonly label: "APP-6(E) Change 2 (version 16)";
    };
};
declare function convertToNumeric(input: unknown, target: NumericTarget, options?: ConversionOptions, adapters?: readonly MappingAdapter[]): ConversionResult;

/**
 * Input normalization, parsing and field validation of MIL-STD-2525C letter SIDCs.
 */

declare function validateSidc(input: unknown, options?: ConversionOptions): ValidationResult;

/**
 * Reads the symbols of an MSDL scenario (SISO-STD-007-2008, Military Scenario Definition Language)
 * as complete MIL-STD-2525C SIDCs.
 *
 * MSDL stores unit and equipment symbols as 15-character 2525B codes with "-" in the fields it
 * keeps elsewhere: affiliation (from the relationships between force sides), status (Present) and
 * country. Echelons are a separate element. `readMsdl` puts those back, so each code can go to
 * `toRenderableSidc`, `convertSidc` or a renderer. Affiliation depends on the point of view: pass
 * `viewpoint` (a force side's handle or name) to get friend/hostile/...; without it, it stays "*".
 *
 * Written from the element descriptions in the standard; no schema file is copied or required.
 */
interface MsdlForceSide {
    handle: string;
    name: string;
    /** The force or side this one shows allegiance to; absent for top-level sides. */
    allegianceHandle?: string;
    /** Relationship to other force sides, as JC3IEDM hostility codes (FR, HO, NEUTRL, ...). */
    relationships: Record<string, string>;
}
interface MsdlSymbol {
    kind: "unit" | "equipment" | "installation";
    handle: string;
    name: string;
    /** The SymbolIdentifier as written in the file. */
    symbolIdentifier: string;
    /** Force side the object belongs to (through its command or organic chain), if found. */
    forceSideHandle?: string;
    /** The SIDC with affiliation, status and echelon filled in where the file gives them. */
    sidc: string;
    /** What was filled in, and anything that could not be (as text). */
    notes: string[];
}
interface MsdlScenario {
    forceSides: MsdlForceSide[];
    symbols: MsdlSymbol[];
}
interface MsdlOptions {
    /** Force side (handle or name) whose point of view decides affiliation. */
    viewpoint?: string;
}
/**
 * JC3IEDM object-item hostility status codes to 2525C standard identity. AIV/IV (involved) and
 * ANT (antagonist) have no 2525C counterpart and stay "*".
 */
declare const MSDL_HOSTILITY_TO_AFFILIATION: Readonly<Record<string, string>>;
/**
 * Reads the force sides, units, equipment and installations of an MSDL document. Throws on XML it
 * cannot read; objects without a 15-character SymbolIdentifier are skipped.
 */
declare function readMsdl(xml: string, options?: MsdlOptions): MsdlScenario;

/**
 * Wildcard ("*") interpretation for MIL-STD-2525C templates.
 *
 * In the 2525C SIDC tables an asterisk marks a position that is "user-defined based on specific
 * symbol circumstances, such as standard identity or echelon/mobility" (A.5.2.1, B.5.2.1, ...).
 * A template such as S*G*UCI---***** therefore stands for a family of concrete SIDCs, not for
 * one symbol. A "*" is only ever replaced by a value the caller supplied explicitly; there are
 * no default substitutions.
 */

type WildcardFieldName = "standardIdentity" | "status" | "symbolModifier" | "countryCode" | "orderOfBattle";
interface WildcardField {
    field: WildcardFieldName;
    /** 1-based positions covered by the field. */
    positions: number[];
    /** Option that supplies the value. */
    option: "affiliation" | "status" | "symbolModifier" | "countryCode" | "orderOfBattle";
    label: string;
}
declare const WILDCARD_FIELDS: readonly WildcardField[];
interface WildcardResolution {
    /** The SIDC after substituting the supplied values (may still contain "*"). */
    sidc: string;
    resolved: {
        field: WildcardFieldName;
        positions: number[];
        value: string;
    }[];
    unresolved: {
        field: WildcardFieldName;
        positions: number[];
        option: WildcardField["option"];
    }[];
    diagnostics: Diagnostic[];
}
/** Lists the wildcard fields of a 15-character SIDC (METOC codes never contain wildcards). */
declare function wildcardFields(sidc: string): WildcardField[];
/**
 * Substitutes caller-supplied values into the wildcard positions of a template.
 * Concrete input characters are never overridden.
 */
declare function resolveWildcards(sidc: string, options: Pick<ConversionOptions, WildcardField["option"]>): WildcardResolution;

/** The fields `toRenderableSidc` can take a fallback value for. */
type FallbackKey = "affiliation" | "status" | "symbolModifier" | "countryCode" | "orderOfBattle";
interface RenderOptions extends Pick<ConversionOptions, "preferredSource" | "mil2525dVersion" | "extendedSidc" | "legacy12Profile" | "strictInput"> {
    /** Values for fields the code leaves as `*`. Never replaces a value the code carries. */
    fallback?: Pick<ConversionOptions, FallbackKey>;
    /** Output standard. Defaults to MIL-STD-2525C: milsymbol draws it with every field kept. */
    targetStandard?: SidcStandard;
}
interface FilledField {
    field: WildcardFieldName;
    positions: number[];
    value: string;
    /** "fallback": from `options.fallback`; "default": the neutral value, nothing was given. */
    from: "fallback" | "default";
}
interface RenderableSidc {
    input: unknown;
    /** Code to draw, or null if nothing usable could be made (e.g. not a SIDC at all). */
    output: string | null;
    /** What the code said that the drawing leaves out. */
    lost: string[];
    targetStandard: SidcStandard;
    /** The repaired, filled 2525C code the result is based on. */
    source2525C: string | null;
    /** exact/equivalent: nothing the code says was lost; lossy/approximate: see `lost`. */
    matchQuality: MatchQuality;
    filled: FilledField[];
    diagnostics: Diagnostic[];
}
declare const toRenderableSidc: (input: unknown, options?: RenderOptions) => RenderableSidc;

/**
 * Field-by-field description of a MIL-STD-2525C SIDC or template, plus the raw mapping
 * evidence each source holds for it. Nothing is converted or resolved here.
 */

interface AnalyzedField {
    name: string;
    positions: number[];
    value: string;
    meaning: string | null;
    wildcard: boolean;
    /** Number of values a wildcard in this field can take (per the 2525C tables), if known. */
    alternatives?: number;
}
interface SidcAnalysis {
    validation: ValidationResult;
    fields: AnalyzedField[];
    isTemplate: boolean;
    /** Wildcard fields and the option that resolves each. */
    wildcards: {
        field: string;
        positions: number[];
        option: string;
        alternatives?: number;
    }[];
    /** Raw evidence per mapping source (independent of any target edition). */
    evidence: MappingEvidence[];
}
declare function analyzeSidc(input: unknown, options?: ConversionOptions, adapters?: readonly MappingAdapter[]): SidcAnalysis;

/**
 * MIL-STD-2525C field definitions per coding scheme.
 *
 * Every value set below is transcribed from the field tables of MIL-STD-2525C (17 Nov 2008):
 * Table A-I/A-II (warfighting, S), B-I/B-II (tactical graphics, G), C-I (METOC, W),
 * D-I (signals intelligence, I), E-I/E-II (stability operations, O), G-I/G-II
 * (emergency management, E). Page numbers refer to that document.
 */
/** Internal: the scheme letter. The public `CodingScheme` (full names) is in constants.ts. */
type CodingScheme = CodingSchemeLetter;
declare const CODING_SCHEMES: Record<CodingScheme, string>;
/** Position 2, identical in Tables A-I, B-I, D-I, E-I and G-I. */
declare const STANDARD_IDENTITIES: Record<string, string>;
/** Position 3 per scheme (battle dimension or category). */
declare const DIMENSIONS: Record<Exclude<CodingScheme, "W">, Record<string, string>>;
/** Position 4 per scheme. */
declare const STATUSES: Record<Exclude<CodingScheme, "W">, Record<string, string>>;
/** Echelon codes, Table A-II / B-II / E-II. */
declare const ECHELONS: Record<string, string>;
/** Allowed values of positions 11-12 per scheme ("--" is always allowed). */
declare const SYMBOL_MODIFIERS: Record<Exclude<CodingScheme, "W">, Record<string, string>>;
/** Position 15 per scheme. */
declare const ORDERS_OF_BATTLE: Record<Exclude<CodingScheme, "W">, Record<string, string>>;
/**
 * Positions that the 2525C SIDC tables mark with `*` ("user-defined based on specific symbol
 * circumstances", A.5.2.1). A `*` anywhere else is not a valid template character.
 */
declare const WILDCARD_POSITIONS: Record<CodingScheme, number[]>;

/**
 * "2525C": a letter SIDC (validity is not checked here); "numeric": a 20- or 30-digit SIDC;
 * "dis": a DIS entity or aggregate type such as "1.1.225.1"; "cot": a Cursor on Target atom type.
 */
type InputKind = "2525C" | "numeric" | "dis" | "cot";
/** The kind of identifier, or null for anything that is not a non-empty string. */
declare function detectInput(input: unknown): InputKind | null;

interface ReadSidcOptions {
    /** For DIS input: the Force ID (sets the affiliation). */
    forceId?: number;
    /** For DIS input: read it as an aggregate type (a unit). */
    aggregate?: boolean;
}
interface ReadSidcResult {
    input: unknown;
    /** What the input was read as, or null if it is not a non-empty string. */
    kind: InputKind | null;
    /** The 2525C SIDC (it may contain "*"; `toRenderableSidc` fills those), or null. */
    output: string | null;
    matchQuality: MatchQuality;
    /** What the input said that the 2525C code leaves out. */
    lost: string[];
    diagnostics: Diagnostic[];
}
/** Reads any supported identifier as a 2525C SIDC. */
declare function readSidc(input: unknown, options?: ReadSidcOptions): ReadSidcResult;

/**
 * Results cache for the conversion functions. A conversion depends only on its input string and
 * options, and the tables never change at run time, so a repeated code (datasets often hold a few
 * hundred distinct codes many times over) can be answered from memory. Each caller gets its own
 * copy, so changing a result never changes another caller's.
 */
/** Sets how many results each converter keeps (default 1000); 0 turns the cache off. */
declare function setCacheSize(size: number): void;

interface SidcToCotResult {
    input: unknown;
    /** CoT type, e.g. "a-f-G-U-C-I", or null. Every converter's result has `output` and `lost`. */
    output: string | null;
    /** What the input said that the output leaves out. */
    lost: string[];
    /** The 2525C code the result is based on (wildcards filled, numeric codes converted). */
    source2525C: string | null;
    /** equivalent: nothing lost; lossy: see `dropped`. */
    matchQuality: MatchQuality;
    diagnostics: Diagnostic[];
}
interface CotToSidcResult {
    input: unknown;
    /** 2525C SIDC, or null. */
    output: string | null;
    /** What the input said that the output leaves out. */
    lost: string[];
    /** equivalent; approximate when a parent symbol or a stand-in identity was used. */
    matchQuality: MatchQuality;
    notes: string[];
    diagnostics: Diagnostic[];
}
interface CotToSidcOptions {
    /** Status for position 4. Default "P" (present). */
    status?: "P" | "A";
}
/** The CoT type for a SIDC (2525C letters, or a numeric 2525D/E or APP-6D/E code). */
declare function sidcToCot(input: unknown): SidcToCotResult;
/** The 2525C SIDC for a CoT atom type such as "a-f-G-U-C-I". */
declare function cotToSidc(type: unknown, options?: CotToSidcOptions): CotToSidcResult;

interface DisEntityType {
    kind: number;
    domain: number;
    country: number;
    category: number;
    subcategory: number;
    specific: number;
    extra: number;
}
interface SidcToDisResult {
    input: unknown;
    /** Entity type, or for units an aggregate type (same seven fields; see `aggregate`). */
    entityType: DisEntityType | null;
    /** True for units: `entityType` is an aggregate type, for the Aggregate State PDU. */
    aggregate: boolean;
    /**
     * The entity type as "kind.domain.country.category.subcategory.specific.extra", or null.
     * Every converter's result has `output` and `lost`.
     */
    output: string | null;
    /** What the input said that the output leaves out. */
    lost: string[];
    /** DIS Force ID for the affiliation (1 friendly, 2 opposing, 3 neutral, 0 other). */
    forceId: number | null;
    /** The 2525C code the result is based on (wildcards filled, numeric codes converted). */
    source2525C: string | null;
    /**
     * equivalent: the symbol says no more than the DIS category; lossy: it says more (a heavy tank,
     * an echelon), which DIS has no field for; approximate: only kind and domain are known.
     */
    matchQuality: MatchQuality;
    /** Names of what was filled in, in words. */
    notes: string[];
    diagnostics: Diagnostic[];
}
interface DisToSidcResult {
    input: unknown;
    /** 2525C SIDC, or null; affiliation is "*" unless `forceId` is given. */
    output: string | null;
    /** What the input said that the output leaves out. */
    lost: string[];
    matchQuality: MatchQuality;
    notes: string[];
    diagnostics: Diagnostic[];
}
interface DisToSidcOptions {
    /** DIS Force ID of the entity; sets the affiliation. Without it, the affiliation stays "*". */
    forceId?: number;
    /** Status for position 4. Default "P" (present): DIS entities are where they are. */
    status?: "P" | "A";
    /** Read the input as an aggregate type (Aggregate State PDU): the result is a unit symbol. */
    aggregate?: boolean;
}
/** DIS Force ID -> 2525C standard identity (Friendly n, Opposing n and Neutral n repeat). */
declare function forceIdToAffiliation(forceId: number): "F" | "H" | "N" | "U";
/** 2525C standard identity -> DIS Force ID (0 "Other" for pending and unknown). */
declare const affiliationToForceId: (identity: string) => number;
/**
 * The DIS entity type for a SIDC (2525C letters, or a numeric 2525D/E or APP-6D/E code). Codes
 * with missing fields are completed first, as in `toRenderableSidc`.
 */
declare function sidcToDis(input: unknown): SidcToDisResult;
/**
 * The 2525C SIDC for a DIS entity type: an object, an array or "1.1.225.1.1.3.0" (missing trailing
 * parts are 0). The symbol depends on kind, domain, category and country only.
 */
declare function disToSidc(entityType: unknown, options?: DisToSidcOptions): DisToSidcResult;

export { ALL_TARGETS, Affiliation, AffiliationLetter, type AnalyzedField, CODING_SCHEMES, type CheckedSidc, CodingScheme$1 as CodingScheme, CodingSchemeLetter, Confidence, type ConversionCandidate, type ConversionMetadata, type ConversionOptions, type ConversionResult, type CotToSidcOptions, type CotToSidcResult, type CountryCode, DIMENSIONS, type Diagnostic, DiagnosticCode, DiagnosticSeverity, type DisEntityType, type DisToSidcOptions, type DisToSidcResult, ECHELONS, Echelon, EchelonLetter, type EditionKey, type FallbackKey, type FilledField, type FuzzyInfo, FuzzyMethod, type InputKind, LEGACY12_PROFILES, type Legacy12Profile, type LegacySidcFields, MSDL_HOSTILITY_TO_AFFILIATION, type MappingAdapter, type MappingEvidence, MappingSource, type MappingSourceName, MatchQuality, Mil2525dVersion, type MsdlForceSide, type MsdlOptions, type MsdlScenario, type MsdlSymbol, NUMERIC_TARGETS, NumericSourceStandard, type NumericTarget, ORDERS_OF_BATTLE, OrderOfBattle, OrderOfBattleLetter, type ReadSidcOptions, type ReadSidcResult, type RenderOptions, type RenderableSidc, type ReverseOptions, STANDARD_IDENTITIES, STATUSES, SYMBOL_MODIFIERS, SYMBOL_SET_NAMES, type SidcAnalysis, SidcStandard, type SidcToCotResult, type SidcToDisResult, Status, StatusLetter, SymbolModifier, SymbolModifierLetter, type TypeOptions, UnitIndicator, UnitIndicatorLetter, type ValidateSidcLiteral, type ValidationResult, WILDCARD_FIELDS, WILDCARD_POSITIONS, type WildcardField, type WildcardFieldName, WildcardPolicy, type WildcardResolution, affiliationToForceId, analyzeSidc, convertNumericTo2525C, convertSidc, convertSidc15To12, convertSidc15To2525D, convertSidc15To2525E, convertSidc15ToApp6D, convertSidc15ToApp6E, convertSidcToAll, convertToNumeric, cotToSidc, defaultAdapters, detectInput, disToSidc, echelonModifier, forceIdToAffiliation, isAffiliation, isCountryCode, isOrderOfBattle, isStatus, isSymbolModifier, jmsmlAdapter, milsymAdapter, readMsdl, readSidc, resolveWildcards, setCacheSize, sidc, sidcToCot, sidcToDis, toRenderableSidc, validateSidc, wildcardFields };
