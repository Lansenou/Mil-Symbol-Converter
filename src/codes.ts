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

/** `{ Name: "Name" }` for every key, so values read as full names. */
function namesOf<K extends string>(
  letters: Record<K, string>,
): { [P in K]: P } {
  return Object.fromEntries(Object.keys(letters).map((k) => [k, k])) as {
    [P in K]: P;
  };
}

/** Position 2: standard identity (Tables A-I, B-I, D-I, E-I, G-I). */
export const AffiliationLetter = {
  Pending: "P",
  Unknown: "U",
  AssumedFriend: "A",
  Friend: "F",
  Neutral: "N",
  Suspect: "S",
  Hostile: "H",
  ExercisePending: "G",
  ExerciseUnknown: "W",
  ExerciseAssumedFriend: "M",
  ExerciseFriend: "D",
  ExerciseNeutral: "L",
  Joker: "J",
  Faker: "K",
} as const;
export const Affiliation = namesOf(AffiliationLetter);
export type Affiliation = keyof typeof AffiliationLetter;
export type AffiliationLetter = (typeof AffiliationLetter)[Affiliation];

/**
 * Position 4: status. FullyCapable, Damaged, Destroyed and FullToCapacity exist for
 * warfighting, SIGINT and stability operations only; Suspected and Known for tactical graphics
 * only (Table B-I).
 */
export const StatusLetter = {
  Anticipated: "A",
  Present: "P",
  FullyCapable: "C",
  Damaged: "D",
  Destroyed: "X",
  FullToCapacity: "F",
  Suspected: "S",
  Known: "K",
} as const;
export const Status = namesOf(StatusLetter);
export type Status = keyof typeof StatusLetter;
export type StatusLetter = (typeof StatusLetter)[Status];

/** Position 12 echelon (Tables A-II, B-II, E-II). */
export const EchelonLetter = {
  TeamCrew: "A",
  Squad: "B",
  Section: "C",
  Platoon: "D",
  Company: "E",
  Battalion: "F",
  Regiment: "G",
  Brigade: "H",
  Division: "I",
  Corps: "J",
  Army: "K",
  ArmyGroup: "L",
  Region: "M",
  Command: "N",
} as const;
export const Echelon = namesOf(EchelonLetter);
export type Echelon = keyof typeof EchelonLetter;
export type EchelonLetter = (typeof EchelonLetter)[Echelon];

/** Position 11 headquarters / task force / feint-dummy indicator (Tables A-II, E-II). */
export const UnitIndicatorLetter = {
  Headquarters: "A",
  TaskForceHeadquarters: "B",
  FeintDummyHeadquarters: "C",
  FeintDummyTaskForceHeadquarters: "D",
  TaskForce: "E",
  FeintDummy: "F",
  FeintDummyTaskForce: "G",
} as const;
export const UnitIndicator = namesOf(UnitIndicatorLetter);
export type UnitIndicator = keyof typeof UnitIndicatorLetter;
export type UnitIndicatorLetter = (typeof UnitIndicatorLetter)[UnitIndicator];

/** Positions 11-12 values that are not an echelon combination (use `echelonModifier` for those). */
export const SymbolModifierLetter = {
  None: "--",
  Installation: "H-",
  FeintDummyInstallation: "HB",
  MobilityWheeled: "MO",
  MobilityCrossCountry: "MP",
  MobilityTracked: "MQ",
  MobilityWheeledAndTracked: "MR",
  MobilityTowed: "MS",
  MobilityRail: "MT",
  MobilityOverSnow: "MU",
  MobilitySled: "MV",
  MobilityPackAnimals: "MW",
  MobilityBarge: "MX",
  MobilityAmphibious: "MY",
  TowedArrayShort: "NS",
  TowedArrayLong: "NL",
} as const;
export const SymbolModifier = namesOf(SymbolModifierLetter);
export type SymbolModifier = keyof typeof SymbolModifierLetter;
/** Positions 11-12: any two-character value of the 2525C modifier tables. */
export type SymbolModifierLetter =
  | (typeof SymbolModifierLetter)[SymbolModifier]
  | `-${EchelonLetter}`
  | `${UnitIndicatorLetter}-`
  | `${UnitIndicatorLetter}${EchelonLetter}`;

/** Position 15: order of battle ("ControlMarkings" X for tactical graphics, "None" for -). */
export const OrderOfBattleLetter = {
  None: "-",
  Air: "A",
  Electronic: "E",
  Civilian: "C",
  Ground: "G",
  Maritime: "N",
  StrategicForceRelated: "S",
  ControlMarkings: "X",
} as const;
export const OrderOfBattle = namesOf(OrderOfBattleLetter);
export type OrderOfBattle = keyof typeof OrderOfBattleLetter;
export type OrderOfBattleLetter = (typeof OrderOfBattleLetter)[OrderOfBattle];

// ---- name/letter lookups

/**
 * Drops what pasted, exported or double-encoded data wraps around a value: surrounding
 * whitespace, zero-width characters, and one pair of quotes (`"Pending"` from a value that was
 * JSON-encoded twice, or curly quotes from a word processor).
 */
const clean = (v: string) =>
  v
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .trim()
    .replace(
      /^(["'\u201C\u2018])(.*)(["'\u201D\u2019])$/s,
      (m, open, body, close) => (QUOTE_PAIRS[open] === close ? body.trim() : m),
    );
const QUOTE_PAIRS: Record<string, string> = {
  '"': '"',
  "'": "'",
  "\u201C": "\u201D",
  "\u2018": "\u2019",
};

/** JSON-quotes a value with invisible and non-ASCII characters escaped, so error messages show them. */
export const visible = (v: unknown) =>
  JSON.stringify(v)?.replace(
    /[^\x20-\x7e]/g,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`,
  ) ?? String(v);

function lookup(table: Record<string, string>) {
  const byName = new Map(
    Object.entries(table).map(([n, l]) => [n.toLowerCase(), l]),
  );
  const letters = new Set(Object.values(table));
  return (v: unknown): string | undefined => {
    if (typeof v !== "string") return undefined;
    // Values often come from files or forms: ignore surrounding whitespace.
    const t = clean(v);
    if (letters.has(t.toUpperCase())) return t.toUpperCase();
    return byName.get(t.toLowerCase());
  };
}
const affiliationOf = lookup(AffiliationLetter);
const statusOf = lookup(StatusLetter);
const echelonOf = lookup(EchelonLetter);
const indicatorOf = lookup(UnitIndicatorLetter);
const plainModifierOf = lookup(SymbolModifierLetter);
const orderOfBattleOf = lookup(OrderOfBattleLetter);

function modifierOf(v: unknown): string | undefined {
  const plain = plainModifierOf(v);
  if (plain) return plain;
  if (typeof v !== "string" || clean(v).length !== 2) return undefined;
  const [a = "", b = ""] = clean(v).toUpperCase();
  const ok =
    (a === "-" && echelonOf(b)) ||
    (indicatorOf(a) && (b === "-" || echelonOf(b)));
  return ok ? `${a}${b}` : undefined;
}

/** Builds positions 11-12 from an echelon and an optional indicator: `echelonModifier("Battalion", "Headquarters")` is `"AF"`. */
export function echelonModifier(
  echelon: Echelon | EchelonLetter,
  indicator?: UnitIndicator | UnitIndicatorLetter,
): SymbolModifierLetter {
  const e = echelonOf(echelon);
  const i = indicator === undefined ? "-" : indicatorOf(indicator);
  if (!e || !i)
    throw new RangeError(`Unknown echelon/indicator: ${echelon}, ${indicator}`);
  return `${i}${e}` as SymbolModifierLetter;
}

type Upper =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  | "P"
  | "Q"
  | "R"
  | "S"
  | "T"
  | "U"
  | "V"
  | "W"
  | "X"
  | "Y"
  | "Z";

/** Positions 13-14: ISO 3166-1 alpha-2 code, or "--" for none. */
export type CountryCode = `${Upper}${Upper}` | "--";

/** Type guards for values read at runtime (form fields, files, other systems): name or letter. */
export const isAffiliation = (
  v: unknown,
): v is Affiliation | AffiliationLetter => affiliationOf(v) !== undefined;
export const isStatus = (v: unknown): v is Status | StatusLetter =>
  statusOf(v) !== undefined;
export const isOrderOfBattle = (
  v: unknown,
): v is OrderOfBattle | OrderOfBattleLetter => orderOfBattleOf(v) !== undefined;
export const isSymbolModifier = (
  v: unknown,
): v is SymbolModifier | SymbolModifierLetter => modifierOf(v) !== undefined;
export const isCountryCode = (v: unknown): v is CountryCode =>
  typeof v === "string" && /^([A-Z]{2}|--)$/.test(v);

/**
 * The 2525C characters for an override given by name or letter; values that are neither are
 * returned unchanged so the converter can report them.
 */
export const overrideLetters = {
  affiliation: (v: string) => affiliationOf(v) ?? v,
  status: (v: string) => statusOf(v) ?? v,
  symbolModifier: (v: string) => modifierOf(v) ?? v,
  countryCode: (v: string) => clean(v),
  orderOfBattle: (v: string) => orderOfBattleOf(v) ?? v,
} as const;

/** What an override accepts, for error messages. */
export const overrideHint: Record<keyof typeof overrideLetters, string> = {
  affiliation: `a name (${Object.keys(AffiliationLetter).join(", ")}) or letter (${Object.values(AffiliationLetter).join("")})`,
  status: `a name (${Object.keys(StatusLetter).join(", ")}) or letter (${Object.values(StatusLetter).join("")})`,
  symbolModifier: `a name (${Object.keys(SymbolModifierLetter).join(", ")}), echelonModifier(...), or two 2525C characters such as "-E"`,
  countryCode: `an ISO 3166-1 alpha-2 code such as "US", or "--"`,
  orderOfBattle: `a name (${Object.keys(OrderOfBattleLetter).join(", ")}) or letter (${Object.values(OrderOfBattleLetter).join("")})`,
};
