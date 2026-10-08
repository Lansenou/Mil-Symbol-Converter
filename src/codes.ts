/**
 * Named constants and literal types for the 2525C values callers pass as options.
 *
 * Each constant is a plain object, so `Affiliation.Hostile` and the literal `"H"` are
 * interchangeable. The values are those of the MIL-STD-2525C field tables (`src/legacy/fields.ts`);
 * whether a value is allowed for a given coding scheme is still checked at runtime.
 */

/** Position 2: standard identity (Tables A-I, B-I, D-I, E-I, G-I). */
export const Affiliation = {
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
export type Affiliation = (typeof Affiliation)[keyof typeof Affiliation];

/**
 * Position 4: status. Operational codes C, D, X, F exist for warfighting, SIGINT and stability
 * operations only; Suspected and Known for tactical graphics only (Table B-I).
 */
export const Status = {
  Anticipated: "A",
  Present: "P",
  FullyCapable: "C",
  Damaged: "D",
  Destroyed: "X",
  FullToCapacity: "F",
  Suspected: "S",
  Known: "K",
} as const;
export type Status = (typeof Status)[keyof typeof Status];

/** Position 12 echelon (Tables A-II, B-II, E-II). */
export const Echelon = {
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
export type Echelon = (typeof Echelon)[keyof typeof Echelon];

/** Position 11 headquarters / task force / feint-dummy indicator (Tables A-II, E-II). */
export const UnitIndicator = {
  Headquarters: "A",
  TaskForceHeadquarters: "B",
  FeintDummyHeadquarters: "C",
  FeintDummyTaskForceHeadquarters: "D",
  TaskForce: "E",
  FeintDummy: "F",
  FeintDummyTaskForce: "G",
} as const;
export type UnitIndicator = (typeof UnitIndicator)[keyof typeof UnitIndicator];

/** Positions 11-12 values that are not an echelon combination. */
export const SymbolModifier = {
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

/** Positions 11-12: any value of the 2525C modifier tables. */
export type SymbolModifier =
  | (typeof SymbolModifier)[keyof typeof SymbolModifier]
  | `-${Echelon}`
  | `${UnitIndicator}-`
  | `${UnitIndicator}${Echelon}`;

/** Builds positions 11-12 from an echelon and an optional indicator: `echelonModifier(Echelon.Battalion, UnitIndicator.Headquarters)` is `"AF"`. */
export function echelonModifier(
  echelon: Echelon,
  indicator?: UnitIndicator,
): SymbolModifier {
  return `${indicator ?? "-"}${echelon}`;
}

/** Position 15: order of battle ("X" for tactical graphics, "-" for none). */
export const OrderOfBattle = {
  None: "-",
  Air: "A",
  Electronic: "E",
  Civilian: "C",
  Ground: "G",
  Maritime: "N",
  StrategicForceRelated: "S",
  ControlMarkings: "X",
} as const;
export type OrderOfBattle = (typeof OrderOfBattle)[keyof typeof OrderOfBattle];

type Letter =
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
export type CountryCode = `${Letter}${Letter}` | "--";

const values = (o: Record<string, string>) => new Set(Object.values(o));
const AFFILIATIONS = values(Affiliation);
const STATUSES = values(Status);
const ECHELONS = values(Echelon);
const INDICATORS = values(UnitIndicator);
const PLAIN_MODIFIERS = values(SymbolModifier);
const ORDERS = values(OrderOfBattle);

/** Type guards for values read at runtime (form fields, files, other systems). */
export const isAffiliation = (v: unknown): v is Affiliation =>
  typeof v === "string" && AFFILIATIONS.has(v);
export const isStatus = (v: unknown): v is Status =>
  typeof v === "string" && STATUSES.has(v);
export const isOrderOfBattle = (v: unknown): v is OrderOfBattle =>
  typeof v === "string" && ORDERS.has(v);
export const isCountryCode = (v: unknown): v is CountryCode =>
  typeof v === "string" && /^([A-Z]{2}|--)$/.test(v);
export const isSymbolModifier = (v: unknown): v is SymbolModifier => {
  if (typeof v !== "string" || v.length !== 2) return false;
  if (PLAIN_MODIFIERS.has(v)) return true;
  const [a = "", b = ""] = v;
  return (
    (a === "-" && ECHELONS.has(b)) ||
    (INDICATORS.has(a) && (b === "-" || ECHELONS.has(b)))
  );
};
