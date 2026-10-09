/**
 * Best-effort SIDC for drawing a symbol (e.g. with milsymbol), from codes with missing fields.
 *
 * `convertSidc` is strict: a `*` it cannot resolve, a lossy mapping or a disagreement between
 * sources gives no output. For display, a symbol that keeps everything the code does say is better
 * than none. `toRenderableSidc`:
 * 1. repairs pasted input (typographic or spaced-out dashes, case, whitespace);
 * 2. fills each `*` field from `fallback` (used only where the code has `*`, never over a value the
 *    code carries), or else with a neutral default: Unknown identity, Present status, no
 *    modifier, no country, no order of battle;
 * 3. if the function ID is not in the 2525C tables, uses the nearest parent symbol that is;
 * 4. for a numeric target, converts with loss allowed and approximate matching, so only what the
 *    target cannot carry is dropped.
 * Everything filled or dropped is listed, so the caller can show what the drawing leaves out.
 */
import { convertSidc } from "./converters/converter";
import { overrideLetters } from "./codes";
import { DiagnosticList } from "./diagnostics";
import { findCatalogEntry, validateSidc } from "./validation";
import { WILDCARD_FIELDS, type WildcardFieldName } from "./wildcard";
import type {
  ConversionOptions,
  Diagnostic,
  MatchQuality,
  SidcStandard,
} from "./types";

type FallbackKey =
  "affiliation" | "status" | "symbolModifier" | "countryCode" | "orderOfBattle";

export interface RenderOptions extends Pick<
  ConversionOptions,
  | "preferredSource"
  | "mil2525dVersion"
  | "extendedSidc"
  | "legacy12Profile"
  | "strictInput"
> {
  /** Values for fields the code leaves as `*`. Never replaces a value the code carries. */
  fallback?: Pick<ConversionOptions, FallbackKey>;
  /** Output standard. Defaults to MIL-STD-2525C: milsymbol draws it with every field kept. */
  targetStandard?: SidcStandard;
}

export interface FilledField {
  field: WildcardFieldName;
  positions: number[];
  value: string;
  /** "fallback": from `options.fallback`; "default": the neutral value, nothing was given. */
  from: "fallback" | "default";
}

export interface RenderableSidc {
  input: unknown;
  /** Code to draw, or null if nothing usable could be made (e.g. not a SIDC at all). */
  sidc: string | null;
  targetStandard: SidcStandard;
  /** The repaired, filled 2525C code the result is based on. */
  source2525C: string | null;
  /** exact/equivalent: nothing the code says was lost; lossy/approximate: see `dropped`. */
  matchQuality: MatchQuality;
  filled: FilledField[];
  /** What the code said that the drawing leaves out. */
  dropped: string[];
  diagnostics: Diagnostic[];
}

/** Neutral value per field, per position: "-" carries no information. */
function defaultFor(field: WildcardFieldName, scheme: string): string {
  switch (field) {
    case "standardIdentity":
      return "U";
    case "status":
      return "P";
    case "orderOfBattle":
      // Tactical graphics carry "X" (control markings) in position 15 (Table B-I).
      return scheme === "G" ? "X" : "-";
    default:
      return "-";
  }
}

const at = (s: string, positions: number[]) =>
  positions.map((p) => s[p - 1]).join("");
const put = (s: string, positions: number[], v: string) => {
  const c = [...s];
  positions.forEach((p, i) => (c[p - 1] = v[i]!));
  return c.join("");
};

export function toRenderableSidc(
  input: unknown,
  options: RenderOptions = {},
): RenderableSidc {
  const target = options.targetStandard ?? "MIL-STD-2525C";
  const d = new DiagnosticList();
  const out = (
    sidc: string | null,
    source2525C: string | null,
    matchQuality: MatchQuality,
    filled: FilledField[] = [],
    dropped: string[] = [],
  ): RenderableSidc => ({
    input,
    sidc,
    targetStandard: target,
    source2525C,
    matchQuality,
    filled,
    dropped,
    diagnostics: d.items,
  });

  const strict = options.strictInput ? { strictInput: true } : {};
  const first = validateSidc(input, strict);
  d.extend(first.diagnostics.filter((x) => x.severity !== "error"));
  let code = first.normalized;
  if (!code || first.fields === null) {
    d.extend(first.diagnostics.filter((x) => x.severity === "error"));
    return out(null, null, "unsupported");
  }
  const scheme = code[0]!;

  // Fill every "*": the caller's fallback where it fits this code, else the neutral default.
  const filled: FilledField[] = [];
  for (const f of WILDCARD_FIELDS) {
    const current = at(code, f.positions);
    if (!current.includes("*")) continue;
    const raw = options.fallback?.[f.option];
    let value: string | undefined;
    if (typeof raw === "string") {
      const letters = overrideLetters[f.option](raw).toUpperCase();
      // Keep given characters where the field is only partly "*" ("A*" stays a headquarters).
      const merged = [...current]
        .map((c, i) => (c === "*" ? letters[i] : c))
        .join("");
      const tried = put(code, f.positions, merged);
      const fits =
        letters.length === f.positions.length &&
        !validateSidc(tried, strict).diagnostics.some(
          (x) =>
            x.severity === "error" &&
            x.positions?.some((p) => f.positions.includes(p)),
        );
      if (fits) value = merged;
      else
        d.warn(
          "OPTION_IGNORED",
          `Fallback ${f.option}="${raw}" does not fit this code at position(s) ${f.positions.join(", ")}; the neutral default was used.`,
          f.positions,
        );
    }
    const from = value === undefined ? "default" : "fallback";
    value ??= [...current]
      .map((c) => (c === "*" ? defaultFor(f.field, scheme) : c))
      .join("");
    code = put(code, f.positions, value);
    filled.push({ field: f.field, positions: f.positions, value, from });
    if (from === "default")
      d.info(
        "WILDCARD_DEFAULTED",
        `No value for ${f.label} (position(s) ${f.positions.join(", ")}); "${value}" was used.`,
        f.positions,
      );
  }

  // A function ID outside the 2525C tables: the nearest listed parent keeps the most.
  const dropped: string[] = [];
  if (!findCatalogEntry(code)) {
    let parent = code;
    for (let p = 10; p >= 5 && !findCatalogEntry(parent); p--)
      if (parent[p - 1] !== "-") parent = put(parent, [p], "-");
    if (findCatalogEntry(parent)) {
      const lost = code.slice(4, 10).replace(/-+$/, "");
      dropped.push(
        `Function ID "${code.slice(4, 10)}" is not in the 2525C tables; drawn as its parent "${parent.slice(4, 10)}" (${findCatalogEntry(parent)!.description}).`,
      );
      d.warn(
        "PARENT_SYMBOL_USED",
        `"${lost}" is not a 2525C function ID; using the parent symbol ${parent}.`,
        [5, 6, 7, 8, 9, 10],
      );
      code = parent;
    }
  }

  const check = validateSidc(code, strict);
  if (!check.valid) {
    d.extend(check.diagnostics.filter((x) => x.severity === "error"));
    return out(null, code, "unsupported", filled, dropped);
  }

  if (target === "MIL-STD-2525C")
    return out(
      code,
      code,
      dropped.length > 0 ? "lossy" : "exact",
      filled,
      dropped,
    );

  const r = convertSidc(code, {
    ...(options.preferredSource && {
      preferredSource: options.preferredSource,
    }),
    ...(options.mil2525dVersion && {
      mil2525dVersion: options.mil2525dVersion,
    }),
    ...(options.extendedSidc && { extendedSidc: true }),
    ...(options.legacy12Profile && {
      legacy12Profile: options.legacy12Profile,
    }),
    targetStandard: target,
    allowLossy: true,
    fuzzy: true,
  });
  d.extend(r.diagnostics);
  if (r.output === null)
    return out(null, code, r.matchQuality, filled, dropped);
  if (r.matchQuality === "lossy" || r.matchQuality === "approximate")
    dropped.push(...r.warnings);
  const quality =
    dropped.length > 0 &&
    (r.matchQuality === "exact" || r.matchQuality === "equivalent")
      ? "lossy"
      : r.matchQuality;
  return out(r.output, code, quality, filled, dropped);
}
