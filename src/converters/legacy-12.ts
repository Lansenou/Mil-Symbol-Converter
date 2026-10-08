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
import type { ConversionOptions, ConversionResult } from "../types";
import { DiagnosticList } from "../diagnostics";
import { prepareInput } from "./prepare";
import { failure, finalize } from "./result";

export interface Legacy12Profile {
  name: string;
  description: string;
  /** References that document consumers of this form. */
  references: string[];
}

export const LEGACY12_PROFILES: Record<string, Legacy12Profile> = {
  "prefix-12": {
    name: "prefix-12",
    description:
      "Positions 1-12 of the 15-character 2525C SIDC (coding scheme, standard identity, dimension, status, function ID, symbol modifier). Positions 13-14 (country code) and 15 (order of battle) are omitted.",
    references: [
      "milsymbol src/lettersidc/metadata.js: positions 13-15 are not read (commented out)",
      "@orbat-mapper/convert-symbology lib/convert.ts: reads positions 1-12; tests use 12-character input",
    ],
  },
};

export function convertSidc15To12(input: unknown, options: ConversionOptions = {}): ConversionResult {
  const d = new DiagnosticList();
  const profileName = options.legacy12Profile ?? "prefix-12";
  const profile = LEGACY12_PROFILES[profileName];
  if (!profile) {
    d.error(
      "UNKNOWN_PROFILE",
      `Unknown 12-character profile "${profileName}". Defined profiles: ${Object.keys(LEGACY12_PROFILES).join(", ")}.`,
    );
    return failure(input, "LEGACY-12", d);
  }
  const prepared = prepareInput(input, options, "LEGACY-12", true, d);
  if (!prepared.ok || prepared.sidc === null) {
    return failure(input, "LEGACY-12", d, { normalizedInput: prepared.validation.normalized });
  }
  const sidc = prepared.sidc;
  const scheme = sidc[0];
  const tail = sidc.slice(12);

  // Which omitted characters carried information?
  const dropped: Record<string, string> = {};
  if (scheme === "W") {
    // Table C-I: position 13 is the last graphic-type character; 14-15 are unused.
    if (sidc[12] !== "-") dropped.graphicType = sidc.slice(10, 13);
  } else {
    const cc = tail.slice(0, 2);
    if (/^[A-Z]{2}$/.test(cc)) dropped.countryCode = cc;
    const ob = tail[2] ?? "-";
    if (ob !== "-" && ob !== "*" && !(scheme === "G" && ob === "X")) dropped.orderOfBattle = ob;
  }
  const output = sidc.slice(0, 12);

  d.info("PROFILE", `Profile ${profile.name}: ${profile.description}`);
  let quality: ConversionResult["matchQuality"] = "exact";
  if (Object.keys(dropped).length > 0) {
    quality = "lossy";
    d.warn(
      "FIELDS_DROPPED",
      `Omitting positions 13-15 drops ${Object.entries(dropped)
        .map(([k, v]) => `${k} "${v}"`)
        .join(" and ")}.`,
      [13, 14, 15],
    );
  } else if (tail.includes("*")) {
    d.warn("WILDCARD_NOT_CARRIED", `Wildcards in positions 13-15 ("${tail}") are omitted with them.`, [13, 14, 15]);
  }
  const lossyBlocked = quality === "lossy" && !options.allowLossy;
  if (lossyBlocked) {
    d.error("LOSSY_NOT_ALLOWED", "The 12-character form loses information here; pass allowLossy: true to accept it.");
  }
  return finalize(
    {
      input: typeof input === "string" ? input : String(input),
      normalizedInput: sidc,
      output: lossyBlocked ? null : output,
      sourceStandard: "MIL-STD-2525C",
      targetStandard: "LEGACY-12",
      matchQuality: quality,
      success: !lossyBlocked,
      warnings: [],
      errors: [],
      diagnostics: [],
      mappingSource: `profile:${profile.name}`,
      ...(lossyBlocked
        ? { candidates: [{ output, matchQuality: "lossy" as const, sources: [profile.name], note: "Rejected because allowLossy is false." }] }
        : {}),
      metadata: {
        codingScheme: scheme ?? "",
        ...(Object.keys(dropped).length ? { droppedFields: dropped } : {}),
        ...(prepared.validation.catalogEntry
          ? {
              legacyDescription: prepared.validation.catalogEntry.description,
              legacyHierarchy: prepared.validation.catalogEntry.hierarchy,
            }
          : {}),
      },
    },
    d,
  );
}
