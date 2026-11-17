/**
 * MIL-STD-2525C SIDC <-> DIS entity type (IEEE 1278.1, enumerations from SISO-REF-010).
 *
 * The two say different things. A SIDC says what kind of thing a symbol stands for ("tank",
 * "frigate"); a DIS entity type names a specific model (kind.domain.country.category.subcategory.
 * specific.extra, e.g. 1.1.225.1.1.3 is an M1A2). So:
 * - `sidcToDis` fills kind, domain, country and, where the symbol has one, the category. Subcategory,
 *   specific and extra stay 0.
 * - `disToSidc` reads kind, domain, category and country, and ignores the rest: every M1 variant
 *   is a tank symbol.
 * Units are aggregates in DIS. For them `sidcToDis` gives an aggregate type (for the Aggregate
 * State PDU): kind 1 (military hierarchy), domain, country, echelon as category, unit type as
 * subcategory, headquarters as specific. `disToSidc` reads one with `{ aggregate: true }`.
 * Affiliation is not part of the entity type. DIS carries it as the Force ID of the entity state;
 * `forceId` in the results and options is that value.
 *
 * The category table below is this library's own reading of the 2525C function IDs. The DIS
 * enumeration names and the country codes come from SISO-REF-010, reprinted with permission from
 * SISO Inc. (see NOTICE).
 */
import dis from "./data/dis.json";
import { DiagnosticList, lostMessages } from "./diagnostics";
import { complete2525C } from "./input";
import type { Diagnostic, MatchQuality } from "./types";

export interface DisEntityType {
  kind: number;
  domain: number;
  country: number;
  category: number;
  subcategory: number;
  specific: number;
  extra: number;
}

export interface SidcToDisResult {
  input: unknown;
  /** Entity type, or for units an aggregate type (same seven fields; see `aggregate`). */
  entityType: DisEntityType | null;
  /** True for units: `entityType` is an aggregate type, for the Aggregate State PDU. */
  aggregate: boolean;
  /**
   * The entity type as "kind.domain.country.category.subcategory.specific.extra".
   * @deprecated Use `output`; removed in 1.0.
   */
  text: string | null;
  /** Same as `text`. Every converter's result has `output` and `lost`. */
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

export interface DisToSidcResult {
  input: unknown;
  /**
   * 2525C SIDC; affiliation is "*" unless `forceId` is given.
   * @deprecated Use `output`; removed in 1.0.
   */
  sidc: string | null;
  /** Same as `sidc`. Every converter's result has `output` and `lost`. */
  output: string | null;
  /** What the input said that the output leaves out. */
  lost: string[];

  matchQuality: MatchQuality;
  notes: string[];
  diagnostics: Diagnostic[];
}

export interface DisToSidcOptions {
  /** DIS Force ID of the entity; sets the affiliation. Without it, the affiliation stays "*". */
  forceId?: number;
  /** Status for position 4. Default "P" (present): DIS entities are where they are. */
  status?: "P" | "A";
  /** Read the input as an aggregate type (Aggregate State PDU): the result is a unit symbol. */
  aggregate?: boolean;
}

type Names = Record<string, string>;
// Read through functions, not module-level constants: a property read at load time keeps the
// data in every bundle, even ones that never convert DIS.
const names = () => dis.names as unknown as Record<string, Names>;
const countryByIso = () => dis.countries as Record<string, number>;
// Built on first use, so bundles that never convert DIS drop this module entirely.
let isoByCountry: Map<number, string> | undefined;
const isoOf = (country: number) =>
  (isoByCountry ??= new Map(
    Object.entries(countryByIso()).map(([iso, n]) => [n, iso]),
  )).get(country);

/** Platform domain per 2525C battle dimension (position 3). */
const DOMAIN: Record<string, number> = { G: 1, A: 2, S: 3, U: 4, P: 5 };
const DIMENSION = ["", "G", "A", "S", "U", "P"];

/**
 * [dimension, function ID prefix, DIS category]. The longest matching prefix wins. For the way
 * back, the first row with a given category is the symbol it becomes.
 */
const PLATFORM: [string, string, number][] = [
  // Land (domain 1)
  ["G", "EVAT", 1], // tank
  ["G", "EVAI", 2], // armored fighting vehicle
  ["G", "EVAA", 2],
  ["G", "EVAL", 2],
  ["G", "EVA", 2],
  ["G", "EVAC", 3], // armored utility vehicle
  ["G", "EVAS", 3],
  ["G", "EWX", 4], // self-propelled artillery (multiple rocket launchers)
  ["G", "EWH", 5], // towed artillery; a mobility modifier makes it self-propelled (below)
  ["G", "EVU", 7], // large wheeled utility vehicle
  ["G", "EWO", 10], // mortar
  ["G", "EVE", 18], // engineer equipment
  ["G", "EVT", 24], // train engine
  ["G", "EVC", 27], // civilian vehicle
  ["G", "EWA", 28], // air defense equipment
  ["G", "EWMA", 28],
  ["G", "EVCA", 81], // car
  ["G", "EVCJ", 81],
  ["G", "EVUB", 82], // bus
  ["G", "EVCM", 82],
  ["G", "EVCO", 83], // single unit cargo truck
  ["G", "EVUS", 85], // multiple unit cargo truck
  ["G", "EVCT", 85],
  ["G", "EVCF", 85],
  // Air (domain 2)
  ["A", "MFF", 1], // fighter/air defense
  ["A", "MFA", 2], // attack/strike
  ["A", "MFB", 3], // bomber
  ["A", "MFC", 4], // cargo/tanker
  ["A", "MFK", 4],
  ["A", "MFP", 5], // ASW/patrol/observation
  ["A", "MFS", 5],
  ["A", "MFJ", 6], // electronic warfare
  ["A", "MFRZ", 6],
  ["A", "MFR", 7], // reconnaissance
  ["A", "MFRW", 8], // surveillance/C2 (AEW)
  ["A", "MFD", 8],
  ["A", "MFH", 9], // air-sea rescue
  ["A", "MHH", 9],
  ["A", "MHA", 20], // attack helicopter
  ["A", "MHU", 21], // utility helicopter
  ["A", "MHS", 22], // ASW/patrol helicopter
  ["A", "MHC", 23], // cargo helicopter
  ["A", "MHR", 24], // observation helicopter
  ["A", "MHM", 25], // special operations helicopter
  ["A", "MHT", 26], // training helicopter
  ["A", "MFT", 40], // trainer
  ["A", "MFQ", 50], // unmanned
  ["A", "MHQ", 50],
  ["A", "CF", 57], // non-combatant commercial aircraft
  // Surface (domain 3)
  ["S", "CLCV", 1], // carrier
  ["S", "CLCC", 2], // command ship/cruiser
  ["S", "CLDD", 5], // destroyer
  ["S", "CP", 7], // light/patrol craft
  ["S", "CM", 8], // mine countermeasure ship
  ["S", "CALS", 10], // tank landing ship
  ["S", "CALC", 11], // landing craft
  ["S", "CH", 15], // air cushion
  ["S", "NH", 15],
  ["S", "XH", 15],
  ["S", "NF", 16], // auxiliary
  ["S", "NS", 16],
  ["S", "CU", 19], // unmanned surface vehicle
  ["S", "CLLL", 20], // littoral combat ship
  ["S", "NI", 21], // surveillance ship
  ["S", "CLFF", 50], // frigate (including corvette)
  ["S", "CLBB", 51], // battleship
  ["S", "CALA", 54], // amphibious assault ship
  ["S", "NR", 60], // fast combat support ship
  ["S", "N", 61], // non-combatant ship
  ["S", "NM", 61],
  ["S", "XL", 62], // coast guard cutter
  ["S", "XAR", 65], // inflatable boat
  ["S", "XMP", 80], // passenger vessel
  ["S", "XMF", 80],
  ["S", "XMC", 81], // dry cargo ship
  ["S", "XMR", 81],
  ["S", "XMO", 82], // tanker
  ["S", "XR", 84], // private motorboat
  ["S", "XA", 84],
  ["S", "XF", 86], // fishing vessel
  // Subsurface (domain 4)
  ["U", "SNB", 1], // SSBN
  ["U", "SNG", 2], // SSGN
  ["U", "SNA", 3], // SSN
  ["U", "SCG", 4], // SSG
  ["U", "SCA", 5], // SS
  ["U", "SU", 8], // UUV
  ["U", "SCB", 9], // SSB
  // Space (domain 5)
  ["P", "V", 1], // manned spacecraft
  ["P", "L", 3], // booster
  ["P", "S", 11], // satellite
];

/** Munitions (kind 2): [dimension, prefix, munition domain, munition category]. */
const MUNITION: [string, string, number, number][] = [
  ["A", "W", 0, 0], // weapon
  ["U", "W", 0, 0],
  ["A", "WM", 0, 1], // missile: guided
  ["A", "WMSA", 1, 1], // surface-to-air: anti-air
  ["A", "WMAA", 1, 1],
  ["A", "WMSB", 3, 1], // antiballistic: anti-guided weapon
  ["A", "WMSU", 7, 1], // surface-to-subsurface: anti-submarine
  ["U", "WT", 0, 1], // torpedo
  ["U", "WM", 0, 3], // sea mine: fixed
  ["G", "EXM", 0, 3], // land mine
  ["G", "EXMC", 8, 3], // claymore: anti-personnel
];

/**
 * Units (aggregate subcategory): [function ID prefix, subcategory]. Longest prefix wins; for the
 * way back, the first row with a subcategory is the symbol it becomes.
 */
const UNIT: [string, number][] = [
  ["UCA", 2], // armor
  ["UCAT", 2],
  ["UCAW", 2],
  ["UCI", 3], // infantry
  ["UCIZ", 4], // mechanized infantry
  ["UCII", 4],
  ["UCRV", 5], // cavalry
  ["UCRVA", 6], // armored cavalry
  ["UCF", 7], // artillery
  ["UCFHE", 8], // self-propelled artillery
  ["UCFMS", 8],
  ["UCFMW", 8],
  ["UCE", 10], // engineer
  ["UCD", 11], // air defense artillery
  ["UCAA", 12], // anti-tank
  ["UCVF", 13], // army aviation fixed-wing
  ["UCVR", 14], // army aviation rotary-wing
  ["UCVRA", 15], // attack helicopter
  ["UCRVO", 16], // air cavalry
  ["UCIM", 18], // motorized rifle
  ["UH", 20], // command post
  ["UUM", 21], // CEWI (military intelligence)
];
/** Subcategories with no symbol of their own: [subcategory, function ID, position 11]. */
const UNIT_EXTRA: Record<number, [string, string]> = {
  1: ["UCRV", "-"], // cavalry troop
  17: ["UCA", "E"], // armor heavy task force
  19: ["UCIZ", "E"], // mechanized heavy task force
  22: ["UCA", "-"], // tank only
};
/** 2525C echelon (position 12) <-> aggregate category. */
const ECHELON_CATEGORY: Record<string, number> = {
  A: 2,
  B: 2,
  C: 2,
  D: 3,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  I: 9,
  J: 10,
};
const CATEGORY_ECHELON = [
  "-",
  "-",
  "A",
  "D",
  "E",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
];
/** Artillery and air defense companies are batteries. */
const BATTERY = [7, 8, 11];

const AFFILIATION_FORCE: Record<string, number> = {
  F: 1,
  A: 1,
  D: 1,
  M: 1,
  H: 2,
  S: 2,
  J: 2,
  K: 2,
  N: 3,
  L: 3,
};

/** DIS Force ID -> 2525C standard identity (Friendly n, Opposing n and Neutral n repeat). */
export function forceIdToAffiliation(forceId: number): "F" | "H" | "N" | "U" {
  if (!Number.isInteger(forceId) || forceId <= 0 || forceId > 30) return "U";
  return (["F", "H", "N"] as const)[(forceId - 1) % 3]!;
}

/** 2525C standard identity -> DIS Force ID (0 "Other" for pending and unknown). */
export const affiliationToForceId = (identity: string): number =>
  AFFILIATION_FORCE[identity.toUpperCase()] ?? 0;

function longest<T extends [string, string, ...unknown[]]>(
  rows: T[],
  dim: string,
  fn: string,
): T | undefined {
  let best: T | undefined;
  for (const r of rows)
    if (
      r[0] === dim &&
      fn.startsWith(r[1]) &&
      (!best || r[1].length > best[1].length)
    )
      best = r;
  return best;
}

const name = (table: string, v: number) => names()[table]?.[String(v)];
const text = (t: DisEntityType) =>
  [
    t.kind,
    t.domain,
    t.country,
    t.category,
    t.subcategory,
    t.specific,
    t.extra,
  ].join(".");

/**
 * The DIS entity type for a SIDC (2525C letters, or a numeric 2525D/E or APP-6D/E code). Codes
 * with missing fields are completed first, as in `toRenderableSidc`.
 */
export function sidcToDis(input: unknown): SidcToDisResult {
  const d = new DiagnosticList();
  const fail = (source2525C: string | null = null): SidcToDisResult => ({
    input,
    entityType: null,
    aggregate: false,
    text: null,
    output: null,
    lost: [],
    forceId: null,
    source2525C,
    matchQuality: "unsupported",
    notes: [],
    diagnostics: d.items,
  });

  const r = complete2525C(input, d);
  if (!r) return fail();
  const code = r.sidc!;

  const scheme = code[0]!;
  const dim = code[2]!;
  const fn = code.slice(4, 10).replace(/-+$/, "");
  const iso = code.slice(12, 14);
  const country = countryByIso()[iso] ?? 0;
  const notes: string[] = [];
  if (country) notes.push(`country ${country} from "${iso}"`);
  else if (/^[A-Z]{2}$/.test(iso))
    d.warn(
      "NO_MAPPING",
      `Country "${iso}" has no DIS country code; country 0 (other) was used.`,
      [13, 14],
    );
  // An affiliation the code leaves open ("*") has no Force ID.
  const forceId = r.filled.some(
    (f) => f.field === "standardIdentity" && f.from === "default",
  )
    ? null
    : affiliationToForceId(code[1]!);

  const done = (
    t: DisEntityType,
    quality: MatchQuality,
    aggregate = false,
  ): SidcToDisResult => ({
    input,
    entityType: t,
    aggregate,
    text: text(t),
    output: text(t),
    lost: lostMessages(d.items),
    forceId,
    source2525C: code,
    matchQuality: quality,
    notes,
    diagnostics: d.items,
  });
  const zero = { subcategory: 0, specific: 0, extra: 0 };

  if (scheme !== "S") {
    d.error(
      "NO_MAPPING",
      "Only warfighting symbols (scheme S) stand for things DIS has entity types for.",
      [1],
    );
    return fail(code);
  }
  if (
    (dim === "G" && fn.startsWith("U")) ||
    dim === "F" ||
    (dim === "S" && fn.startsWith("G"))
  ) {
    // Units: an aggregate type. Naval groups are surface aggregates, SOF units land ones.
    const domain = dim === "S" ? 3 : 1;
    const u =
      dim === "G"
        ? longest(
            UNIT.map((r) => ["G", ...r] as [string, string, number]),
            "G",
            fn,
          )
        : undefined;
    const subcategory = u?.[2] ?? 0;
    const echelon = code[11]!;
    let category = ECHELON_CATEGORY[echelon] ?? 0;
    if (category === 5 && BATTERY.includes(subcategory)) category = 4;
    const specific = "ABCD".includes(code[10]!) ? 1 : 0;
    notes.unshift(
      "aggregate kind 1 (military hierarchy)",
      `domain ${domain} (${name("platformDomain", domain)})`,
    );
    if (category)
      notes.push(
        `category ${category} (${name("aggregateCategory", category)}) from echelon "${echelon}"`,
      );
    if (u)
      notes.push(
        `subcategory ${subcategory} (${name("aggregateSubcategory", subcategory)}) from "${u[1]}"`,
      );
    if (specific) notes.push("specific 1: has a headquarters");
    const lost =
      (u ? fn !== u[1] : fn !== "U" && dim === "G") ||
      (echelon !== "-" && !category) ||
      !"-ABCD".includes(code[10]!);
    if (!u && dim === "G" && fn !== "U")
      d.warn(
        "NO_MAPPING",
        `DIS has no aggregate subcategory for "${fn}"; subcategory 0 (other) was used.`,
        [5, 6, 7, 8, 9, 10],
      );
    else if (lost)
      d.info(
        "FIELDS_DROPPED",
        `The aggregate type has no field for the rest of the symbol (${code.slice(4, 12)}).`,
      );
    return done(
      { kind: 1, domain, country, category, subcategory, specific, extra: 0 },
      !u && dim === "G" && fn !== "U"
        ? "approximate"
        : lost
          ? "lossy"
          : "equivalent",
      true,
    );
  }
  if (dim === "G" && fn.startsWith("I")) {
    notes.unshift("kind 5 (cultural feature): an installation");
    return done(
      { kind: 5, domain: 1, country, category: 0, ...zero },
      fn === "I" ? "equivalent" : "lossy",
    );
  }

  const m = longest(MUNITION, dim, fn);
  if (m) {
    notes.unshift(
      `kind 2 (munition)`,
      `domain ${m[2]} (${name("munitionDomain", m[2])})`,
      `category ${m[3]} (${name("munitionCategory", m[3])})`,
    );
    return done(
      { kind: 2, domain: m[2], country, category: m[3], ...zero },
      m[1] === fn ? "equivalent" : "lossy",
    );
  }

  const domain = DOMAIN[dim];
  if (domain === undefined || (dim === "G" && !fn.startsWith("E") && fn)) {
    d.error(
      "NO_MAPPING",
      `No DIS platform for battle dimension "${dim}"${fn ? ` with function ID "${fn}"` : ""}.`,
      [3],
    );
    return fail(code);
  }
  notes.unshift(
    "kind 1 (platform)",
    `domain ${domain} (${name("platformDomain", domain)})`,
  );
  const p = longest(PLATFORM, dim, fn);
  let category = p?.[2] ?? 0;
  // A howitzer with a mobility modifier (position 11 "M") is self-propelled.
  if (p?.[1] === "EWH" && code[10] === "M") category = 4;
  if (!p) {
    if (fn)
      d.warn(
        "NO_MAPPING",
        `DIS has no category for "${fn}"; category 0 (other) was used.`,
        [5, 6, 7, 8, 9, 10],
      );
    return done(
      { kind: 1, domain, country, category: 0, ...zero },
      fn ? "approximate" : "equivalent",
    );
  }
  notes.push(
    `category ${category} (${name(`1.${domain}`, category)}) from "${p[1]}"`,
  );
  const lost = fn !== p[1] || /[A-Z]/.test(code.slice(10, 12));
  if (lost)
    d.info(
      "FIELDS_DROPPED",
      `DIS has no field for the rest of the symbol (${code.slice(4, 12)}); subcategory, specific and extra are 0.`,
    );
  return done(
    { kind: 1, domain, country, category, ...zero },
    lost ? "lossy" : "equivalent",
  );
}

function parseEntityType(input: unknown): DisEntityType | null {
  let parts: unknown[] | null = null;
  if (typeof input === "string") parts = input.trim().split(/[.:\s]+/);
  else if (Array.isArray(input)) parts = input;
  else if (input && typeof input === "object") {
    const o = input as Record<string, unknown>;
    parts = [
      o.kind,
      o.domain,
      o.country,
      o.category,
      o.subcategory,
      o.specific,
      o.extra,
    ];
  }
  if (!parts || parts.length < 2 || parts.length > 7) return null;
  const n = Array.from({ length: 7 }, (_, i) =>
    parts[i] === undefined ? 0 : Number(parts[i]),
  );
  if (n.some((v) => !Number.isInteger(v) || v < 0 || v > 65535)) return null;
  const [kind, domain, country, category, subcategory, specific, extra] = n as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  return { kind, domain, country, category, subcategory, specific, extra };
}

/**
 * The 2525C SIDC for a DIS entity type: an object, an array or "1.1.225.1.1.3.0" (missing trailing
 * parts are 0). The symbol depends on kind, domain, category and country only.
 */
export function disToSidc(
  entityType: unknown,
  options: DisToSidcOptions = {},
): DisToSidcResult {
  const d = new DiagnosticList();
  const out = (
    sidc: string | null,
    matchQuality: MatchQuality,
    notes: string[] = [],
  ): DisToSidcResult => ({
    input: entityType,
    sidc,
    output: sidc,
    lost: lostMessages(d.items),
    matchQuality,
    notes,
    diagnostics: d.items,
  });
  const t = parseEntityType(entityType);
  if (!t) {
    d.error(
      "INVALID_TYPE",
      'Expected a DIS entity type: {kind, domain, ...}, [1, 1, 225, 1] or "1.1.225.1.0.0.0".',
    );
    return out(null, "unsupported");
  }

  const notes: string[] = [];
  let affiliation = "*";
  if (options.forceId !== undefined) {
    affiliation = forceIdToAffiliation(options.forceId);
    notes.push(
      `affiliation ${affiliation} from Force ID ${options.forceId} (${name("forceId", options.forceId) ?? "unknown"})`,
    );
  }
  const status = options.status ?? "P";
  const iso = isoOf(t.country);
  if (iso) notes.push(`country "${iso}" from ${t.country}`);
  else if (t.country)
    d.warn(
      "NO_MAPPING",
      `DIS country ${t.country} has no ISO 3166 code; the country is left out.`,
    );
  const build = (dim: string, fn: string, mod = "--") =>
    `S${affiliation}${dim}${status}${fn.padEnd(6, "-")}${mod}${iso ?? "--"}-`;

  if (options.aggregate) {
    if (t.kind !== 1 || (t.domain !== 1 && t.domain !== 3)) {
      d.error(
        "NO_MAPPING",
        `No 2525C unit symbol for aggregate kind ${t.kind} (${name("aggregateKind", t.kind) ?? "unknown"}) in domain ${t.domain}; only military hierarchies on land or at sea have one.`,
      );
      return out(null, "unsupported", notes);
    }
    const echelon = CATEGORY_ECHELON[t.category] ?? "-";
    if (t.category > 10)
      d.warn(
        "NO_MAPPING",
        `No 2525C echelon for aggregate category ${t.category}.`,
      );
    if (t.domain === 3) {
      notes.unshift("naval group");
      return out(
        build("S", "G", "-" + echelon),
        t.subcategory ? "lossy" : "equivalent",
        notes,
      );
    }
    const row = UNIT.find((r) => r[1] === t.subcategory);
    const extra = UNIT_EXTRA[t.subcategory];
    const fn = row?.[0] ?? extra?.[0] ?? "U";
    const hq = t.specific === 1;
    const tf = extra?.[1] === "E";
    const pos11 = tf ? (hq ? "B" : "E") : hq ? "A" : "-";
    notes.unshift(
      `unit${t.subcategory ? `, ${name("aggregateSubcategory", t.subcategory) ?? `subcategory ${t.subcategory}`}` : ""}`,
    );
    if (t.category)
      notes.push(
        `echelon "${echelon}" from ${name("aggregateCategory", t.category) ?? t.category}`,
      );
    const known = !t.subcategory || row || extra;
    if (!known)
      d.warn(
        "NO_MAPPING",
        `No 2525C symbol for aggregate subcategory ${t.subcategory}; the unit frame was used.`,
      );
    return out(
      build("G", fn, pos11 + echelon),
      !known ? "approximate" : extra && !row ? "lossy" : "equivalent",
      notes,
    );
  }

  let dim: string;
  let fn: string;
  let exact = true;
  if (t.kind === 1 && t.domain >= 1 && t.domain <= 5) {
    dim = DIMENSION[t.domain]!;
    const row = PLATFORM.find((r) => r[0] === dim && r[2] === t.category);
    fn = row?.[1] ?? (dim === "G" ? "E" : "");
    if (t.category && !row) {
      exact = false;
      d.warn(
        "NO_MAPPING",
        `No 2525C symbol for ${name(`1.${t.domain}`, t.category) ?? `category ${t.category}`}; the ${name("platformDomain", t.domain)} frame was used.`,
      );
    }
    notes.unshift(
      `${name("platformDomain", t.domain)} platform${t.category && row ? `, ${name(`1.${t.domain}`, t.category)}` : ""}`,
    );
  } else if (t.kind === 2) {
    const row =
      MUNITION.find((r) => r[2] === t.domain && r[3] === t.category) ??
      MUNITION.find((r) => r[3] === t.category);
    dim = row?.[0] ?? "A";
    fn = row?.[1] ?? "W";
    exact = !!row && row[2] === t.domain;
    if (!exact)
      d.warn(
        "NO_MAPPING",
        "The munition's domain or category has no 2525C symbol of its own; a more general weapon symbol was used.",
      );
    notes.unshift("munition");
  } else if (t.kind === 5) {
    notes.unshift("cultural feature, drawn as an installation");
    return out(
      `S${affiliation}G${status}I-----H-${iso ?? "--"}-`,
      "approximate",
      notes,
    );
  } else {
    d.error(
      "NO_MAPPING",
      `No 2525C symbol for DIS entity kind ${t.kind} (${name("kind", t.kind) ?? "unknown"}) with domain ${t.domain}.`,
    );
    return out(null, "unsupported", notes);
  }
  const more = t.subcategory || t.specific || t.extra;
  if (more)
    d.info(
      "FIELDS_DROPPED",
      `Subcategory, specific and extra (${t.subcategory}.${t.specific}.${t.extra}: the model) have no place in a SIDC.`,
    );
  return out(
    build(dim, fn),
    !exact ? "approximate" : more ? "lossy" : "equivalent",
    notes,
  );
}
