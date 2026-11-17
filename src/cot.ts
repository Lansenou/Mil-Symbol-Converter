/**
 * MIL-STD-2525C SIDC <-> Cursor on Target (CoT) type, as used by TAK.
 *
 * A CoT atom type is built from the warfighting SIDC: "a", the standard identity in lower case,
 * the battle dimension, then each character of the function ID, joined with "-". So
 * SFGPUCI---- is "a-f-G-U-C-I" and SHGPEVAT--- is "a-h-G-E-V-A-T". Status, modifiers (echelon,
 * headquarters), country and order of battle have no place in the type; CoT carries some of them
 * elsewhere in the event.
 */
import { convertNumericTo2525C } from "./converters/reverse";
import { DiagnosticList } from "./diagnostics";
import { toRenderableSidc } from "./render";
import { findCatalogEntry } from "./validation";
import type { Diagnostic, MatchQuality } from "./types";

export interface SidcToCotResult {
  input: unknown;
  /** CoT type, e.g. "a-f-G-U-C-I", or null. */
  cot: string | null;
  /** The 2525C code the result is based on (wildcards filled, numeric codes converted). */
  source2525C: string | null;
  /** equivalent: nothing lost; lossy: see `dropped`. */
  matchQuality: MatchQuality;
  /** What the code said that the CoT type leaves out. */
  dropped: string[];
  diagnostics: Diagnostic[];
}

export interface CotToSidcResult {
  input: unknown;
  /** 2525C SIDC, or null. */
  sidc: string | null;
  /** equivalent; approximate when a parent symbol or a stand-in identity was used. */
  matchQuality: MatchQuality;
  notes: string[];
  diagnostics: Diagnostic[];
}

export interface CotToSidcOptions {
  /** Status for position 4. Default "P" (present). */
  status?: "P" | "A";
}

/** CoT identities with no 2525C exercise form; exercise identities lose the exercise. */
const EXERCISE: Record<string, string> = {
  G: "p",
  W: "u",
  M: "a",
  D: "f",
  L: "n",
};

/** The CoT type for a SIDC (2525C letters, or a numeric 2525D/E or APP-6D/E code). */
export function sidcToCot(input: unknown): SidcToCotResult {
  const d = new DiagnosticList();
  const out = (
    cot: string | null,
    source2525C: string | null,
    matchQuality: MatchQuality,
    dropped: string[] = [],
  ): SidcToCotResult => ({
    input,
    cot,
    source2525C,
    matchQuality,
    dropped,
    diagnostics: d.items,
  });

  let letters = input;
  if (typeof input === "string" && /^\s*\d{20}(\d{10})?\s*$/.test(input)) {
    const r = convertNumericTo2525C(input.trim());
    if (!r.output) {
      d.extend(r.diagnostics);
      return out(null, null, "unsupported");
    }
    letters = r.output;
  }
  const r = toRenderableSidc(letters);
  d.extend(r.diagnostics);
  const code = r.sidc;
  if (!code) return out(null, null, "unsupported");
  if (code[0] !== "S") {
    d.error(
      "NO_MAPPING",
      "CoT atom types exist for warfighting symbols (scheme S) only.",
      [1],
    );
    return out(null, code, "unsupported");
  }

  const dropped = [...r.dropped];
  let identity = code[1]!;
  if (EXERCISE[identity]) {
    dropped.push(
      `Exercise identity "${identity}" is drawn as "${EXERCISE[identity]}": CoT has no exercise identities.`,
    );
    identity = EXERCISE[identity]!;
  }
  const status = code[3]!;
  if (status !== "P")
    dropped.push(`Status "${status}" (position 4): CoT types carry no status.`);
  const mod = code.slice(10, 12);
  const installation = code[2] === "G" && code[4] === "I" && mod === "H-";
  if (mod !== "--" && !installation)
    dropped.push(
      `Modifier "${mod}" (positions 11-12, e.g. echelon or headquarters): CoT types carry none.`,
    );
  if (code.slice(12, 14) !== "--")
    dropped.push(`Country "${code.slice(12, 14)}": CoT types carry none.`);
  if (code[14] !== "-")
    dropped.push(`Order of battle "${code[14]}": CoT types carry none.`);
  if (dropped.length > 0) d.info("FIELDS_DROPPED", dropped.join(" "));

  const fn = code.slice(4, 10).replace(/-+$/, "");
  const cot = ["a", identity.toLowerCase(), code[2]!, ...fn].join("-");
  return out(cot, code, dropped.length > 0 ? "lossy" : "equivalent", dropped);
}

/** CoT identity letter -> 2525C standard identity. "o" (none) and "x" (other) have no 2525C form. */
const IDENTITY: Record<string, string> = {
  p: "P",
  u: "U",
  a: "A",
  f: "F",
  n: "N",
  s: "S",
  h: "H",
  j: "J",
  k: "K",
  ".": "*",
};

/** The 2525C SIDC for a CoT atom type such as "a-f-G-U-C-I". */
export function cotToSidc(
  type: unknown,
  options: CotToSidcOptions = {},
): CotToSidcResult {
  const d = new DiagnosticList();
  const notes: string[] = [];
  const out = (
    sidc: string | null,
    matchQuality: MatchQuality,
  ): CotToSidcResult => ({
    input: type,
    sidc,
    matchQuality,
    notes,
    diagnostics: d.items,
  });
  const m =
    typeof type === "string"
      ? /^a-([a-z.])-([PAGSUF])((?:-[A-Z0-9])*)$/i.exec(type.trim())
      : null;
  if (!m) {
    d.error(
      "INVALID_TYPE",
      'Expected a CoT atom type such as "a-f-G-U-C-I" ("a", identity, battle dimension, function ID letters).',
    );
    return out(null, "unsupported");
  }
  const fn = m[3]!.replace(/-/g, "").toUpperCase();
  if (fn.length > 6) {
    d.error(
      "INVALID_LENGTH",
      `The function ID "${fn}" is longer than the 6 characters of a 2525C code.`,
    );
    return out(null, "unsupported");
  }
  let quality: MatchQuality = "equivalent";
  const cotIdentity = m[1]!.toLowerCase();
  let identity = IDENTITY[cotIdentity];
  if (!identity) {
    identity = "U";
    quality = "approximate";
    d.warn(
      "UNMAPPED_STANDARD_IDENTITY",
      `CoT identity "${cotIdentity}" (${cotIdentity === "o" ? "none specified" : "other"}) has no 2525C identity; "U" (unknown) was used.`,
      [2],
    );
  }
  const dim = m[2]!.toUpperCase();
  const mod = dim === "G" && fn[0] === "I" ? "H-" : "--";
  let sidc = `S${identity}${dim}${options.status ?? "P"}${fn.padEnd(6, "-")}${mod}---`;
  notes.push(`identity "${identity}" from "${cotIdentity}"`);

  if (!findCatalogEntry(sidc)) {
    // Not a 2525C symbol: the nearest listed parent.
    const r = toRenderableSidc(sidc);
    if (!r.sidc) {
      d.extend(r.diagnostics);
      return out(null, "unsupported");
    }
    d.extend(r.diagnostics.filter((x) => x.code === "PARENT_SYMBOL_USED"));
    if (r.sidc !== sidc) {
      quality = "approximate";
    }
    sidc = r.sidc.slice(0, 1) + identity + r.sidc.slice(2);
  }
  return out(sidc, quality);
}
