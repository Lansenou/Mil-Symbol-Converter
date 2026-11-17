/**
 * The mapping tables of src/dis.ts: this library's own reading of the 2525C function IDs against
 * the DIS (SISO-REF-010) categories. Numbers are DIS enumeration values.
 */
/** Platform domain per 2525C battle dimension (position 3). */
export const DOMAIN: Record<string, number> = { G: 1, A: 2, S: 3, U: 4, P: 5 };
export const DIMENSION = ["", "G", "A", "S", "U", "P"];

/**
 * [dimension, function ID prefix, DIS category]. The longest matching prefix wins. For the way
 * back, the first row with a given category is the symbol it becomes.
 */
export const PLATFORM: [string, string, number][] = [
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
export const MUNITION: [string, string, number, number][] = [
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
export const UNIT: [string, number][] = [
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
export const UNIT_EXTRA: Record<number, [string, string]> = {
  1: ["UCRV", "-"], // cavalry troop
  17: ["UCA", "E"], // armor heavy task force
  19: ["UCIZ", "E"], // mechanized heavy task force
  22: ["UCA", "-"], // tank only
};
/** 2525C echelon (position 12) <-> aggregate category. */
export const ECHELON_CATEGORY: Record<string, number> = {
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
export const CATEGORY_ECHELON = [
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
export const BATTERY = [7, 8, 11];

export const AFFILIATION_FORCE: Record<string, number> = {
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
