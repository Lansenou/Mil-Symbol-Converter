/**
 * Field-level mapping of 2525C positions 2, 4 and 11-12 to the numeric SIDC digits 3-4
 * (standard identity), 7 (status), 8 (HQ/task force/dummy) and 9-10 (amplifier).
 *
 * Code values come from JMSML Base.xml (<LegacyStandardIdentityCode>, <LegacyStatusCode>,
 * <LegacyHQTFDummyCode>, <LegacyModifierCode>) which cross-references MIL-STD-2525D
 * Tables A-II, A-IV, A-V and A-VI. Where JMSML lists a value for one coding scheme only, the
 * extension to another scheme is stated next to the rule together with the 2525C table that
 * defines the same value for that scheme.
 */
import { fields } from "../data/index";
import type { CodingScheme } from "../legacy/fields";
import type { MatchQuality } from "../types";
import { DiagnosticList } from "../diagnostics";

export interface FieldDigits {
  standardIdentity: string;
  status: string;
  hqtfd: string;
  amplifier: string;
  quality: MatchQuality;
}

/** Scheme whose JMSML table row defines the value for a given 2525C scheme. */
const HQTFD_SCHEME: Partial<Record<CodingScheme, "S" | "O">> = {
  S: "S",
  O: "O",
};
// Echelons: JMSML lists S and O. Table B-II (G) uses the same echelon letters as Table A-II.
const ECHELON_SCHEME: Partial<Record<CodingScheme, "S" | "O">> = {
  S: "S",
  O: "O",
  G: "S",
};
// Mobility: JMSML lists S. Table G-II (E) uses the same mobility codes as Table A-II.
const MOBILITY_SCHEME: Partial<Record<CodingScheme, "S">> = { S: "S", E: "S" };

export function mapFields(sidc: string, d: DiagnosticList): FieldDigits | null {
  const scheme = sidc[0] as CodingScheme;
  let quality: MatchQuality = "exact";
  const before = d.items.length;

  // --- Standard identity (digits 3-4)
  let standardIdentity: string | undefined;
  if (scheme === "W") {
    // JMSML maps METOC categories A/O/S to Reality + Pending (Affiliations REALITY_METOC_*).
    standardIdentity = fields.metocCategory[sidc[1] ?? ""];
  } else {
    standardIdentity = fields.standardIdentity[sidc[1] ?? ""];
  }
  if (standardIdentity === undefined) {
    d.error(
      "UNMAPPED_STANDARD_IDENTITY",
      `No numeric standard identity for "${sidc[1]}".`,
      [2],
    );
  }

  // --- Status (digit 7)
  let status: string | undefined;
  const s = sidc[3] ?? "";
  if (scheme === "W") {
    // 2525C METOC codes have no status (Table C-I). mil-sym-ts C2DLookup leaves the digit at
    // its default 0 (Present); this library does the same and says so.
    status = "0";
    d.info(
      "METOC_STATUS_DEFAULT",
      "2525C METOC codes have no status field; numeric status digit 0 (Present) is used, as in mil-sym-ts.",
      [7],
    );
  } else if (scheme === "G" && s === "S") {
    // Table B-I "S - Suspected"; 2525D Table A-IV code 1 is "Planned/Anticipated/Suspect",
    // which also covers "A - Anticipated/planned": the distinction is lost.
    status = "1";
    quality = "lossy";
    d.warn(
      "STATUS_MERGED",
      'Tactical graphic status "S" (suspected) maps to numeric status 1 "Planned/Anticipated/Suspect", which no longer distinguishes suspected from planned.',
      [4],
    );
  } else if (scheme === "G" && s === "K") {
    d.error(
      "UNMAPPED_STATUS",
      'Tactical graphic status "K" (known) has no documented numeric status (not in JMSML or MIL-STD-2525D Table A-IV).',
      [4],
    );
  } else {
    status = fields.status[s];
    if (status === undefined)
      d.error("UNMAPPED_STATUS", `No numeric status for "${s}".`, [4]);
  }

  // --- HQ/TF/dummy (digit 8) and amplifier (digits 9-10)
  let hqtfd = "0";
  let amplifier = "00";
  const mod = scheme === "W" ? "--" : sidc.slice(10, 12);
  const c11 = mod[0] ?? "-";
  const c12 = mod[1] ?? "-";
  if (mod === "--") {
    // null
  } else if (mod === "H-") {
    // Installation: expressed by the Land Installation symbol set, no digit of its own.
  } else if (mod === "HB") {
    // Table A-II / E-II "HB Feint dummy installation" -> 2525D Table A-V code 1 "Feint/Dummy".
    // (Not in JMSML Base.xml; the 2525D table is the source.)
    hqtfd = "1";
  } else if (c11 === "M" || c11 === "N") {
    const tableScheme =
      c11 === "M" ? MOBILITY_SCHEME[scheme] : scheme === "S" ? "S" : undefined;
    const amp = tableScheme
      ? fields.amplifiers[`${tableScheme}:${mod}`]
      : undefined;
    if (amp === undefined)
      d.error(
        "UNMAPPED_MODIFIER",
        `No numeric amplifier for "${mod}".`,
        [11, 12],
      );
    else amplifier = amp;
  } else {
    if (c11 !== "-") {
      const hs = HQTFD_SCHEME[scheme];
      const h = hs ? fields.hqtfd[`${hs}:${c11}`] : undefined;
      if (h === undefined)
        d.error(
          "UNMAPPED_MODIFIER",
          `No numeric HQ/TF/dummy code for "${c11}".`,
          [11],
        );
      else hqtfd = h;
    }
    if (c12 !== "-") {
      const es = ECHELON_SCHEME[scheme];
      const amp = es ? fields.amplifiers[`${es}:-${c12}`] : undefined;
      if (amp === undefined)
        d.error(
          "UNMAPPED_MODIFIER",
          `No numeric echelon code for "${c12}".`,
          [12],
        );
      else amplifier = amp;
    }
  }

  const failed = d.items.slice(before).some((i) => i.severity === "error");
  if (failed || standardIdentity === undefined || status === undefined)
    return null;
  return { standardIdentity, status, hqtfd, amplifier, quality };
}
