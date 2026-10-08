/**
 * Typed access to the generated tables in this directory (see scripts/build-data.mjs and
 * src/data/provenance.json). The JSON files hold raw source evidence only; all rules that
 * decide match quality live in src/converters.
 */
import catalogRows from "./mil-std-2525c-catalog.json";
import legacyMappings from "./legacy-mappings.json";
import editionCatalogs from "./edition-catalogs.json";
import fieldCodes from "./field-codes.json";
import contestedJson from "./contested-codes.json";

export interface CatalogEntry {
  template: string;
  description: string;
  hierarchy: string;
}

/** JMSML legacy link: 2525C template -> 2525D symbol (base 2525D, version 10). */
export interface JmsmlRow {
  template: string;
  symbolSet: string;
  entity: string;
  m1: string;
  m2: string;
  /** JMSML marks the 2525C symbol as retired (no 2525D counterpart). */
  retired: boolean;
  /** The template is the <LegacySymbol> label rather than an additional function code. */
  label: boolean;
}

/** mil-sym-ts c2d row: 2525C basic ID -> code of the given SIDC version. */
export interface MilsymRow {
  basic: string;
  version: string;
  symbolSet: string;
  entity: string;
  m1: string;
  m2: string;
}

/** Catalog keys of the editions whose names we can check codes against. */
export type EditionKey =
  "2525D" | "2525Dch1" | "APP-6D" | "2525Ech1" | "APP-6Ech2";

/**
 * Lookup key shared by all tables: coding scheme + dimension + function ID, with standard
 * identity and status masked. METOC codes have no user-defined positions and use the full code.
 */
export function legacyKey(sidc: string): string {
  if (sidc[0] === "W") return sidc;
  return `${sidc[0]}*${sidc[2]}*${sidc.slice(4, 10)}`;
}

function group<T>(items: T[], key: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    const list = m.get(k);
    if (list) list.push(it);
    else m.set(k, [it]);
  }
  return m;
}

export const catalog: CatalogEntry[] = (catalogRows as string[][]).map(
  ([template = "", description = "", hierarchy = ""]) => ({
    template,
    description,
    hierarchy,
  }),
);
export const catalogByKey = group(catalog, (c) => legacyKey(c.template));

export const jmsmlRows: JmsmlRow[] = (legacyMappings.jmsml as string[][]).map(
  ([
    template = "",
    symbolSet = "",
    entity = "",
    m1 = "",
    m2 = "",
    flags = "",
  ]) => ({
    template,
    symbolSet,
    entity,
    m1,
    m2,
    retired: flags.includes("R"),
    label: flags.includes("L"),
  }),
);
export const jmsmlByKey = group(jmsmlRows, (r) => legacyKey(r.template));

export const milsymRows: MilsymRow[] = (
  legacyMappings.milsym as string[][]
).map(
  ([
    basic = "",
    version = "",
    symbolSet = "",
    entity = "",
    m1 = "",
    m2 = "",
  ]) => ({
    basic,
    version,
    symbolSet,
    entity,
    m1: m1.padStart(2, "0"),
    m2: m2.padStart(2, "0"),
  }),
);
export const milsymByKey = group(milsymRows, (r) => legacyKey(r.basic));

const names: string[] = editionCatalogs.names;
const catalogs = editionCatalogs.catalogs as Record<
  EditionKey,
  { entities: Record<string, number>; modifiers: Record<string, number> }
>;

/** Name of an entity code ("10|121100") in an edition, or undefined if absent. */
export function entityName(
  edition: EditionKey,
  symbolSet: string,
  entity: string,
): string | undefined {
  const i = catalogs[edition].entities[`${symbolSet}|${entity}`];
  return i === undefined ? undefined : names[i];
}

/** Name of a sector modifier ("10|2|02") in an edition; "00" is always "Unspecified". */
export function modifierName(
  edition: EditionKey,
  symbolSet: string,
  sector: 1 | 2,
  code: string,
): string | undefined {
  if (code === "00") return "Unspecified";
  const i = catalogs[edition].modifiers[`${symbolSet}|${sector}|${code}`];
  return i === undefined ? undefined : names[i];
}

export const fields = fieldCodes as {
  standardIdentity: Record<string, string>;
  metocCategory: Record<string, string>;
  status: Record<string, string>;
  hqtfd: Record<string, string>;
  amplifiers: Record<string, string>;
};

export interface ContestedCode {
  editions: EditionKey[];
  symbolSet: string;
  kind: "entity" | "modifier1" | "modifier2";
  code: string;
  claims: { source: string; meaning: string }[];
  reference: string;
}

/** Codes whose meaning in a given edition is disputed between implementations. */
export const contested: ContestedCode[] =
  contestedJson.codes as ContestedCode[];

export const SYMBOL_SET_NAMES: Record<string, string> = {
  "00": "Unknown",
  "01": "Air",
  "02": "Air Missile",
  "05": "Space",
  "06": "Space Missile",
  "10": "Land Unit",
  "11": "Land Civilian Unit/Organization",
  "15": "Land Equipment",
  "20": "Land Installation",
  "25": "Control Measure",
  "30": "Sea Surface",
  "35": "Sea Subsurface",
  "36": "Mine Warfare",
  "40": "Activities",
  "45": "Atmospheric",
  "46": "Oceanographic",
  "47": "Meteorological Space",
  "50": "Signals Intelligence - Space",
  "51": "Signals Intelligence - Air",
  "52": "Signals Intelligence - Land",
  "53": "Signals Intelligence - Surface",
  "54": "Signals Intelligence - Subsurface",
  "60": "Cyberspace",
};

/** All entities of a symbol set in an edition, as [entity code, name]. */
export function entitiesOf(
  edition: EditionKey,
  symbolSet: string,
): [string, string][] {
  const prefix = `${symbolSet}|`;
  return Object.entries(catalogs[edition].entities)
    .filter(([k]) => k.startsWith(prefix))
    .map(([k, i]) => [k.slice(prefix.length), names[i] ?? ""]);
}

/** All sector modifiers of a symbol set in an edition, as [sector, code, name]. */
export function modifiersOf(
  edition: EditionKey,
  symbolSet: string,
): [1 | 2, string, string][] {
  const prefix = `${symbolSet}|`;
  return Object.entries(catalogs[edition].modifiers)
    .filter(([k]) => k.startsWith(prefix))
    .map(([k, i]) => {
      const [, sector, code] = k.split("|");
      return [sector === "2" ? 2 : 1, code ?? "", names[i] ?? ""];
    });
}
