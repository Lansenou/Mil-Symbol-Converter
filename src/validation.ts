/**
 * Input normalization, parsing and field validation of MIL-STD-2525C letter SIDCs.
 */
import { catalogByKey, legacyKey, type CatalogEntry } from "./data/index";
import {
  DIMENSIONS,
  METOC,
  ORDERS_OF_BATTLE,
  STANDARD_IDENTITIES,
  STATUSES,
  SYMBOL_MODIFIERS,
  WILDCARD_POSITIONS,
  type CodingScheme,
} from "./legacy/fields";
import type {
  ConversionOptions,
  Diagnostic,
  LegacySidcFields,
  ValidationResult,
} from "./types";
import { DiagnosticList } from "./diagnostics";

export const LEGACY_SIDC_LENGTH = 15;

const TYPOGRAPHIC_DASHES = /[‐-―−﹘﹣－]/;

/** Splits a 15-character SIDC into its positional fields (no validation). */
export function parseLegacyFields(sidc: string): LegacySidcFields {
  return {
    codingScheme: sidc.slice(0, 1),
    standardIdentity: sidc.slice(1, 2),
    battleDimension: sidc.slice(2, 3),
    status: sidc.slice(3, 4),
    functionId: sidc.slice(4, 10),
    symbolModifier: sidc.slice(10, 12),
    countryCode: sidc.slice(12, 14),
    orderOfBattle: sidc.slice(14, 15),
  };
}

/** Normalizes raw input to an uppercase 15-character candidate string, or reports why not. */
export function normalizeInput(
  input: unknown,
  options: Pick<ConversionOptions, "strictInput"> = {},
  d: DiagnosticList = new DiagnosticList(),
): string | null {
  if (typeof input !== "string") {
    d.error(
      "INVALID_TYPE",
      `Expected the SIDC as a string, received ${input === null ? "null" : typeof input}.`,
    );
    return null;
  }
  let s = input;
  if (s.length === 0) {
    d.error("EMPTY_INPUT", "The SIDC is empty.");
    return null;
  }
  if (s.trim() !== s) {
    if (options.strictInput) {
      d.error(
        "SURROUNDING_WHITESPACE",
        "The SIDC has leading or trailing whitespace.",
      );
      return null;
    }
    s = s.trim();
    d.warn("WHITESPACE_TRIMMED", "Leading/trailing whitespace was removed.");
  }
  // Check characters before any case mapping: toUpperCase() can change the length of non-ASCII text.
  const bad: number[] = [];
  let typographic = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i] ?? "";
    if (!/[A-Za-z0-9*-]/.test(ch)) {
      bad.push(i + 1);
      if (TYPOGRAPHIC_DASHES.test(ch)) typographic = true;
    }
  }
  if (bad.length > 0) {
    d.error(
      "INVALID_CHARACTERS",
      `Invalid character(s) at position(s) ${bad.join(", ")}. Only A-Z, 0-9, "-" and "*" are allowed` +
        (typographic
          ? '; typographic dashes (e.g. "—") must be the ASCII hyphen-minus "-".'
          : "."),
      bad,
    );
    return null;
  }
  if (/[a-z]/.test(s)) {
    if (options.strictInput) {
      d.error("LOWERCASE", "Letter SIDCs are uppercase.");
      return null;
    }
    s = s.toUpperCase();
    d.warn(
      "LOWERCASE_NORMALIZED",
      "Lowercase letters were converted to uppercase.",
    );
  }
  if (s.length !== LEGACY_SIDC_LENGTH) {
    let hint = "";
    if (/^\d+$/.test(s) && (s.length === 20 || s.length === 30)) {
      hint =
        " This looks like a numeric (2525D/E, APP-6D/E) SIDC; the input must be a 2525C letter SIDC.";
    } else if (s.length < LEGACY_SIDC_LENGTH) {
      hint =
        " Shortened forms (such as a 10- or 12-character prefix) are not complete 2525C SIDCs; positions are never guessed.";
    }
    d.error(
      "INVALID_LENGTH",
      `A MIL-STD-2525C SIDC has ${LEGACY_SIDC_LENGTH} characters; received ${s.length}.${hint}`,
    );
    return null;
  }
  return s;
}

function checkField(
  d: DiagnosticList,
  value: string,
  allowed: Record<string, string>,
  position: number,
  label: string,
  wildcardOk: boolean,
): void {
  if (value === "*" && wildcardOk) return;
  if (!(value in allowed)) {
    d.error(
      "INVALID_FIELD_VALUE",
      `Position ${position} (${label}) "${value}" is not valid here. Allowed: ${Object.keys(allowed).join(", ")}${
        wildcardOk ? ", *" : ""
      }.`,
      [position],
    );
  }
}

/** Finds the 2525C table row that the (possibly templated) SIDC instantiates. */
export function findCatalogEntry(sidc: string): CatalogEntry | undefined {
  const rows = catalogByKey.get(legacyKey(sidc));
  if (!rows) return undefined;
  // Prefer the row whose fixed characters all agree with the input.
  return (
    rows.find((r) =>
      [...r.template].every(
        (t, i) => t === "*" || sidc[i] === "*" || t === sidc[i],
      ),
    ) ?? rows[0]
  );
}

/**
 * Validates a MIL-STD-2525C SIDC: characters, length, per-scheme field values, wildcard
 * placement and field combinations that the 2525C tables rule out.
 */
export function validateSidc(
  input: unknown,
  options: ConversionOptions = {},
): ValidationResult {
  const d = new DiagnosticList();
  const normalized = normalizeInput(input, options, d);
  const base: ValidationResult = {
    input,
    valid: false,
    normalized: null,
    isTemplate: false,
    wildcardPositions: [],
    fields: null,
    errors: [],
    warnings: [],
    diagnostics: [],
  };
  if (normalized === null) return finish(base, d);

  const fields = parseLegacyFields(normalized);
  const scheme = fields.codingScheme as CodingScheme;
  const wildcardPositions = [...normalized].flatMap((c, i) =>
    c === "*" ? [i + 1] : [],
  );
  base.normalized = normalized;
  base.fields = fields;
  base.wildcardPositions = wildcardPositions;
  base.isTemplate = wildcardPositions.length > 0;

  if (!["S", "G", "W", "I", "O", "E"].includes(scheme)) {
    d.error(
      "INVALID_CODING_SCHEME",
      `Position 1 (coding scheme) "${fields.codingScheme}" is not a MIL-STD-2525C coding scheme (S, G, W, I, O, E).`,
      [1],
    );
    return finish(base, d);
  }

  const allowedWildcards = WILDCARD_POSITIONS[scheme];
  const misplaced = wildcardPositions.filter(
    (p) => !allowedWildcards.includes(p),
  );
  if (misplaced.length > 0) {
    d.error(
      "INVALID_WILDCARD_POSITION",
      `"*" is only allowed where the 2525C tables mark a user-defined position (${
        allowedWildcards.length ? allowedWildcards.join(", ") : "none for METOC"
      }); found at ${misplaced.join(", ")}.`,
      misplaced,
    );
  }

  if (scheme === "W") {
    validateMetoc(normalized, d);
  } else {
    checkField(
      d,
      fields.standardIdentity,
      STANDARD_IDENTITIES,
      2,
      "standard identity",
      true,
    );
    checkField(
      d,
      fields.battleDimension,
      DIMENSIONS[scheme],
      3,
      "battle dimension/category",
      false,
    );
    checkField(d, fields.status, STATUSES[scheme], 4, "status", true);
    validateFunctionId(fields.functionId, d);
    const mod = fields.symbolModifier;
    if (mod.includes("*")) {
      const fits = Object.keys(SYMBOL_MODIFIERS[scheme]).some((k) =>
        [...mod].every((c, i) => c === "*" || c === k[i]),
      );
      if (!fits) {
        d.error(
          "INVALID_FIELD_VALUE",
          `Positions 11-12 (symbol modifier) "${mod}" cannot be completed to a valid table value.`,
          [11, 12],
        );
      }
    } else {
      checkField(
        d,
        mod,
        SYMBOL_MODIFIERS[scheme],
        11,
        "symbol modifier (positions 11-12)",
        false,
      );
    }
    const cc = fields.countryCode;
    if (!(cc === "--" || cc === "**" || /^[A-Z]{2}$/.test(cc))) {
      d.error(
        "INVALID_FIELD_VALUE",
        `Positions 13-14 (country code) "${cc}" must be an ISO 3166-1 alpha-2 code, "--" or "**".`,
        [13, 14],
      );
    }
    const ob = fields.orderOfBattle;
    if (scheme === "G" && ob === "-") {
      d.warn(
        "NONSTANDARD_ORDER_OF_BATTLE",
        'MIL-STD-2525C Table B-I requires "X" in position 15 of tactical graphics; "-" was accepted (it carries no information).',
        [15],
      );
    } else if (ob !== "-") {
      checkField(
        d,
        ob,
        ORDERS_OF_BATTLE[scheme],
        15,
        "order of battle",
        scheme !== "G",
      );
    }
  }

  // Catalog membership and combinations ruled out by the tables.
  const entry = findCatalogEntry(normalized);
  if (entry) {
    base.catalogEntry = entry;
    if (scheme !== "W") checkCombinations(normalized, entry, scheme, d);
    else if (entry.template !== normalized) {
      d.error(
        "UNKNOWN_SYMBOL",
        `METOC code ${normalized} differs from the 2525C table entry ${entry.template}.`,
      );
    }
  } else {
    d.warn(
      "NOT_IN_2525C_TABLES",
      `No row of the MIL-STD-2525C SIDC tables has function ID "${fields.functionId}" for coding scheme ${scheme}, dimension/category "${fields.battleDimension}".`,
      [5, 6, 7, 8, 9, 10],
    );
  }

  base.valid = !d.hasErrors();
  return finish(base, d);
}

function validateFunctionId(fn: string, d: DiagnosticList): void {
  // "The values in each field are filled from left to right" (2525C A.5.2.1).
  const firstDash = fn.indexOf("-");
  if (firstDash >= 0 && /[A-Z0-9]/.test(fn.slice(firstDash))) {
    d.error(
      "INVALID_FIELD_VALUE",
      `Function ID "${fn}" is not filled from left to right.`,
      [5, 6, 7, 8, 9, 10],
    );
  }
}

function validateMetoc(sidc: string, d: DiagnosticList): void {
  // Table C-I: category, static/dynamic, function ID, graphic type, positions 14-15 unused.
  const category = sidc.slice(1, 2);
  const sd = sidc.slice(2, 4);
  const gt = sidc.slice(10, 13);
  if (!(category in METOC.categories)) {
    d.error(
      "INVALID_FIELD_VALUE",
      `METOC position 2 (category) "${category}" must be A, O or S.`,
      [2],
    );
  }
  if (!(sd in METOC.staticDynamic)) {
    d.error(
      "INVALID_FIELD_VALUE",
      `METOC positions 3-4 (static/dynamic) "${sd}" must be "S-" or "-D".`,
      [3, 4],
    );
  }
  if (!(gt in METOC.graphicTypes)) {
    d.error(
      "INVALID_FIELD_VALUE",
      `METOC positions 11-13 (graphic type) "${gt}" must be "P--", "-L-" or "--A".`,
      [11, 12, 13],
    );
  }
  if (sidc.slice(13, 15) !== "--") {
    d.error(
      "INVALID_FIELD_VALUE",
      'METOC positions 14-15 are not used and must be "--".',
      [14, 15],
    );
  }
}

function checkCombinations(
  sidc: string,
  entry: CatalogEntry,
  scheme: CodingScheme,
  d: DiagnosticList,
): void {
  const templateH = entry.template[10] === "H";
  const inputH = sidc[10] === "H";
  if (templateH && sidc[10] !== "H" && sidc[10] !== "*") {
    d.error(
      "INSTALLATION_INDICATOR_REQUIRED",
      `${entry.description} is an installation (2525C template ${entry.template}); position 11 must be "H". Did you mean ${sidc.slice(0, 10)}H${sidc[11] === "B" ? "B" : "-"}${sidc.slice(12)}?`,
      [11],
    );
  }
  if (!templateH && inputH) {
    d.error(
      "INSTALLATION_INDICATOR_NOT_APPLICABLE",
      `Position 11 "H" (installation) is only valid for installation codes; ${entry.description} (${entry.template}) is not one.`,
      [11],
    );
  }
  if (scheme === "I" && sidc.slice(10, 12) !== "--") {
    d.error(
      "INVALID_FIELD_VALUE",
      "Positions 11-12 are not used for signals intelligence.",
      [11, 12],
    );
  }
}

function finish(r: ValidationResult, d: DiagnosticList): ValidationResult {
  r.diagnostics = d.items;
  r.errors = d.messages("error");
  r.warnings = d.messages("warning");
  return r;
}

export type { Diagnostic };
