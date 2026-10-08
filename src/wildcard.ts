/**
 * Wildcard ("*") interpretation for MIL-STD-2525C templates.
 *
 * In the 2525C SIDC tables an asterisk marks a position that is "user-defined based on specific
 * symbol circumstances, such as standard identity or echelon/mobility" (A.5.2.1, B.5.2.1, ...).
 * A template such as S*G*UCI---***** therefore stands for a family of concrete SIDCs, not for
 * one symbol. A "*" is only ever replaced by a value the caller supplied explicitly; there are
 * no default substitutions.
 */
import type { ConversionOptions, Diagnostic } from "./types";
import { DiagnosticList } from "./diagnostics";

export type WildcardFieldName =
  | "standardIdentity"
  | "status"
  | "symbolModifier"
  | "countryCode"
  | "orderOfBattle";

export interface WildcardField {
  field: WildcardFieldName;
  /** 1-based positions covered by the field. */
  positions: number[];
  /** Option that supplies the value. */
  option: "affiliation" | "status" | "symbolModifier" | "countryCode" | "orderOfBattle";
  label: string;
}

export const WILDCARD_FIELDS: readonly WildcardField[] = [
  { field: "standardIdentity", positions: [2], option: "affiliation", label: "standard identity" },
  { field: "status", positions: [4], option: "status", label: "status" },
  { field: "symbolModifier", positions: [11, 12], option: "symbolModifier", label: "symbol modifier" },
  { field: "countryCode", positions: [13, 14], option: "countryCode", label: "country code" },
  { field: "orderOfBattle", positions: [15], option: "orderOfBattle", label: "order of battle" },
];

export interface WildcardResolution {
  /** The SIDC after substituting the supplied values (may still contain "*"). */
  sidc: string;
  resolved: { field: WildcardFieldName; positions: number[]; value: string }[];
  unresolved: { field: WildcardFieldName; positions: number[]; option: WildcardField["option"] }[];
  diagnostics: Diagnostic[];
}

const slice = (sidc: string, positions: number[]) =>
  positions.map((p) => sidc[p - 1] ?? "").join("");

/** Lists the wildcard fields of a 15-character SIDC (METOC codes never contain wildcards). */
export function wildcardFields(sidc: string): WildcardField[] {
  return WILDCARD_FIELDS.filter((f) => slice(sidc, f.positions).includes("*"));
}

/**
 * Substitutes caller-supplied values into the wildcard positions of a template.
 * Concrete input characters are never overridden.
 */
export function resolveWildcards(
  sidc: string,
  options: Pick<ConversionOptions, WildcardField["option"]>,
): WildcardResolution {
  const d = new DiagnosticList();
  const chars = [...sidc];
  const resolved: WildcardResolution["resolved"] = [];
  const unresolved: WildcardResolution["unresolved"] = [];

  for (const f of WILDCARD_FIELDS) {
    const current = slice(sidc, f.positions);
    const raw = options[f.option];
    const supplied = typeof raw === "string" ? raw.toUpperCase() : undefined;
    if (!current.includes("*")) {
      if (supplied !== undefined && supplied !== current) {
        d.warn(
          "OPTION_IGNORED",
          `Option ${f.option}="${raw}" was ignored: the input already specifies ${f.label} "${current}" at position(s) ${f.positions.join(", ")}.`,
          f.positions,
        );
      }
      continue;
    }
    if (supplied === undefined) {
      unresolved.push({ field: f.field, positions: f.positions, option: f.option });
      continue;
    }
    if (supplied.length !== f.positions.length || supplied.includes("*")) {
      d.error(
        "INVALID_RESOLUTION_VALUE",
        `Option ${f.option} must be ${f.positions.length} concrete character(s); received "${raw}".`,
        f.positions,
      );
      unresolved.push({ field: f.field, positions: f.positions, option: f.option });
      continue;
    }
    // A partially specified field (e.g. "-*") must agree with the supplied value.
    const conflict = [...current].some((c, i) => c !== "*" && c !== supplied[i]);
    if (conflict) {
      d.error(
        "INVALID_RESOLUTION_VALUE",
        `Option ${f.option}="${raw}" conflicts with the concrete part of "${current}".`,
        f.positions,
      );
      unresolved.push({ field: f.field, positions: f.positions, option: f.option });
      continue;
    }
    f.positions.forEach((p, i) => {
      chars[p - 1] = supplied[i] ?? "*";
    });
    resolved.push({ field: f.field, positions: f.positions, value: supplied });
  }
  return { sidc: chars.join(""), resolved, unresolved, diagnostics: d.items };
}
