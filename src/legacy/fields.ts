/**
 * MIL-STD-2525C field definitions per coding scheme.
 *
 * Every value set below is transcribed from the field tables of MIL-STD-2525C (17 Nov 2008):
 * Table A-I/A-II (warfighting, S), B-I/B-II (tactical graphics, G), C-I (METOC, W),
 * D-I (signals intelligence, I), E-I/E-II (stability operations, O), G-I/G-II
 * (emergency management, E). Page numbers refer to that document.
 */

export type CodingScheme = "S" | "G" | "W" | "I" | "O" | "E";

export const CODING_SCHEMES: Record<CodingScheme, string> = {
  S: "Warfighting (Appendix A)",
  G: "Tactical graphics (Appendix B)",
  W: "Meteorological and oceanographic (Appendix C)",
  I: "Signals intelligence (Appendix D)",
  O: "Stability operations (Appendix E)",
  E: "Emergency management (Appendix G)",
};

/** Position 2, identical in Tables A-I, B-I, D-I, E-I and G-I. */
export const STANDARD_IDENTITIES: Record<string, string> = {
  P: "Pending",
  U: "Unknown",
  A: "Assumed friend",
  F: "Friend",
  N: "Neutral",
  S: "Suspect",
  H: "Hostile",
  G: "Exercise pending",
  W: "Exercise unknown",
  M: "Exercise assumed friend",
  D: "Exercise friend",
  L: "Exercise neutral",
  J: "Joker",
  K: "Faker",
};

/** Position 3 per scheme (battle dimension or category). */
export const DIMENSIONS: Record<
  Exclude<CodingScheme, "W">,
  Record<string, string>
> = {
  // Table A-I (p. 51)
  S: {
    P: "Space",
    A: "Air",
    G: "Ground",
    S: "Sea surface",
    U: "Sea subsurface",
    F: "SOF",
    X: "Other (no frame)",
    Z: "Unknown",
  },
  // Table B-I (p. 305)
  G: {
    T: "Tasks",
    G: "C2 & general maneuver",
    M: "Mobility/survivability",
    F: "Fire support",
    S: "Combat service support",
    O: "Other",
  },
  // Table D-I (p. 964)
  I: {
    P: "Space",
    A: "Air",
    G: "Ground",
    S: "Sea surface",
    U: "Sea subsurface",
    X: "Other",
    Z: "Unknown",
  },
  // Table E-I (p. 991)
  O: {
    V: "Violent activities",
    L: "Locations",
    O: "Operations",
    I: "Items",
    P: "Individual",
    G: "Nonmilitary group or organization",
    R: "Rape",
  },
  // Table G-I (p. 1032)
  E: {
    I: "Incident",
    N: "Natural events",
    O: "Operations",
    F: "Infrastructure",
  },
};

const OPERATIONAL_STATUS: Record<string, string> = {
  A: "Anticipated/planned",
  P: "Present",
  C: "Present/fully capable",
  D: "Present/damaged",
  X: "Present/destroyed",
  F: "Present/full to capacity",
};

/** Position 4 per scheme. */
export const STATUSES: Record<
  Exclude<CodingScheme, "W">,
  Record<string, string>
> = {
  S: OPERATIONAL_STATUS, // Table A-I
  I: OPERATIONAL_STATUS, // Table D-I
  O: OPERATIONAL_STATUS, // Table E-I
  E: { A: "Anticipated/planned", P: "Present" }, // Table G-I
  G: { A: "Anticipated/planned", S: "Suspected", P: "Present", K: "Known" }, // Table B-I
};

/** Echelon codes, Table A-II / B-II / E-II. */
export const ECHELONS: Record<string, string> = {
  A: "Team/crew",
  B: "Squad",
  C: "Section",
  D: "Platoon/detachment",
  E: "Company/battery/troop",
  F: "Battalion/squadron",
  G: "Regiment/group",
  H: "Brigade",
  I: "Division",
  J: "Corps/MEF",
  K: "Army",
  L: "Army group/front",
  M: "Region",
  N: "Command",
};

/** Position 11 indicators combinable with an echelon, Table A-II / E-II. */
export const HQ_TF_FD: Record<string, string> = {
  A: "Headquarters",
  B: "Task force headquarters",
  C: "Feint/dummy headquarters",
  D: "Feint/dummy task force headquarters",
  E: "Task force",
  F: "Feint/dummy",
  G: "Feint/dummy task force",
};

export const MOBILITY: Record<string, string> = {
  MO: "Mobility wheeled/limited cross country",
  MP: "Mobility cross country",
  MQ: "Mobility tracked",
  MR: "Mobility wheeled and tracked combination",
  MS: "Mobility towed",
  MT: "Mobility rail",
  MU: "Mobility over the snow",
  MV: "Mobility sled",
  MW: "Mobility pack animals",
  MX: "Mobility barge",
  MY: "Mobility amphibious",
};

export const TOWED_ARRAYS: Record<string, string> = {
  NS: "Towed array (short)",
  NL: "Towed array (long)",
};

export const INSTALLATIONS: Record<string, string> = {
  "H-": "Installation",
  HB: "Feint dummy installation",
};

function echelonCodes(prefixes: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of prefixes) {
    const head = p === "-" ? "" : `${HQ_TF_FD[p]} `;
    if (p !== "-") out[`${p}-`] = HQ_TF_FD[p] ?? p;
    for (const [e, name] of Object.entries(ECHELONS))
      out[`${p}${e}`] = `${head}${name}`.trim();
  }
  return out;
}

/** Allowed values of positions 11-12 per scheme ("--" is always allowed). */
export const SYMBOL_MODIFIERS: Record<
  Exclude<CodingScheme, "W">,
  Record<string, string>
> = {
  // Table A-II (pp. 52-54)
  S: {
    "--": "Null",
    ...echelonCodes(["-", "A", "B", "C", "D", "E", "F", "G"]),
    ...INSTALLATIONS,
    ...MOBILITY,
    ...TOWED_ARRAYS,
  },
  // Table B-II (p. 305): echelon only
  G: { "--": "Null", ...echelonCodes(["-"]) },
  // Table D-I (p. 964): positions 11 and 12 are not used
  I: { "--": "Not used" },
  // Table E-II (pp. 992-994)
  O: {
    "--": "Null",
    ...echelonCodes(["-", "A", "B", "C", "D", "E", "F", "G"]),
    ...INSTALLATIONS,
  },
  // Table G-II (p. 1032)
  E: { "--": "Null", "H-": "Installation", ...MOBILITY },
};

/** Position 15 per scheme. */
export const ORDERS_OF_BATTLE: Record<
  Exclude<CodingScheme, "W">,
  Record<string, string>
> = {
  S: {
    A: "Air OB",
    E: "Electronic OB",
    C: "Civilian OB",
    G: "Ground OB",
    N: "Maritime OB",
    S: "Strategic force related",
  },
  I: {
    A: "Air OB",
    E: "Electronic OB",
    C: "Civilian OB",
    G: "Ground OB",
    N: "Maritime OB",
    S: "Strategic force related",
  },
  O: {
    A: "Air OB",
    E: "Electronic OB",
    C: "Civilian OB",
    G: "Ground OB",
    N: "Maritime OB",
    S: "Strategic force related",
  },
  E: {
    A: "Air OB",
    E: "Electronic OB",
    C: "Civilian OB",
    G: "Ground OB",
    N: "Maritime OB",
    S: "Strategic force related",
  },
  // Table B-I: "All tactical graphics described in this appendix will have an X in this position."
  G: { X: "Control markings" },
};

/** METOC (Table C-I, p. 763). */
export const METOC = {
  categories: { A: "Atmospheric", O: "Oceanic", S: "Space" } as Record<
    string,
    string
  >,
  staticDynamic: { "S-": "Static", "-D": "Dynamic" } as Record<string, string>,
  graphicTypes: { "P--": "Point", "-L-": "Line", "--A": "Area" } as Record<
    string,
    string
  >,
};

/**
 * Positions that the 2525C SIDC tables mark with `*` ("user-defined based on specific symbol
 * circumstances", A.5.2.1). A `*` anywhere else is not a valid template character.
 */
export const WILDCARD_POSITIONS: Record<CodingScheme, number[]> = {
  S: [2, 4, 11, 12, 13, 14, 15],
  G: [2, 4, 11, 12, 13, 14],
  I: [2, 4, 13, 14, 15],
  O: [2, 4, 11, 12, 13, 14, 15],
  E: [2, 4, 11, 12, 13, 14, 15],
  W: [],
};
