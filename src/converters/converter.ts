/**
 * Public conversion API.
 */
import type {
  ConversionOptions,
  ConversionResult,
  SidcStandard,
} from "../types";
import { DiagnosticList } from "../diagnostics";
import { convertSidc15To12 } from "./legacy-12";
import { convertToNumeric, NUMERIC_TARGETS } from "./numeric";
import { prepareInput } from "./prepare";
import { failure, finalize, inputAsString } from "./result";

/** 15-character MIL-STD-2525C -> 20-digit MIL-STD-2525D (version 10, or 11 with mil2525dVersion). */
export function convertSidc15To2525D(
  input: unknown,
  options: ConversionOptions = {},
): ConversionResult {
  const version = options.mil2525dVersion ?? "10";
  if (version !== "10" && version !== "11") {
    const d = new DiagnosticList();
    d.error(
      "UNSUPPORTED_VERSION",
      `mil2525dVersion must be "10" or "11"; received "${String(version)}".`,
    );
    return failure(input, "MIL-STD-2525D", d);
  }
  return convertToNumeric(
    input,
    version === "10" ? NUMERIC_TARGETS["2525D"] : NUMERIC_TARGETS["2525Dch1"],
    options,
  );
}

/** 15-character MIL-STD-2525C -> 20-digit APP-6(D) (version 10). */
export function convertSidc15ToApp6D(
  input: unknown,
  options: ConversionOptions = {},
): ConversionResult {
  return convertToNumeric(input, NUMERIC_TARGETS["APP-6D"], options);
}

/** 15-character MIL-STD-2525C -> 20-digit MIL-STD-2525E Change 1 (version 15). */
export function convertSidc15To2525E(
  input: unknown,
  options: ConversionOptions = {},
): ConversionResult {
  return convertToNumeric(input, NUMERIC_TARGETS["2525E"], options);
}

/** 15-character MIL-STD-2525C -> 20-digit APP-6(E) Change 2 (version 16). */
export function convertSidc15ToApp6E(
  input: unknown,
  options: ConversionOptions = {},
): ConversionResult {
  return convertToNumeric(input, NUMERIC_TARGETS["APP-6E"], options);
}

export { convertSidc15To12 };

function unsupportedTarget(
  input: unknown,
  target: SidcStandard,
  reason: string,
): ConversionResult {
  const d = new DiagnosticList();
  d.error("UNSUPPORTED_TARGET", reason);
  return failure(input, target, d);
}

/**
 * Converts a MIL-STD-2525C SIDC to `options.targetStandard` (default MIL-STD-2525D).
 */
export function convertSidc(
  input: unknown,
  options: ConversionOptions = {},
): ConversionResult {
  const target = options.targetStandard ?? "MIL-STD-2525D";
  switch (target) {
    case "MIL-STD-2525D":
      return convertSidc15To2525D(input, options);
    case "APP-6D":
      return convertSidc15ToApp6D(input, options);
    case "MIL-STD-2525E":
      return convertSidc15To2525E(input, options);
    case "APP-6E":
      return convertSidc15ToApp6E(input, options);
    case "LEGACY-12":
      return convertSidc15To12(input, options);
    case "MIL-STD-2525C": {
      // Identity conversion: validation, normalization and wildcard resolution only.
      const d = new DiagnosticList();
      const p = prepareInput(input, options, target, true, d);
      if (!p.ok || p.sidc === null)
        return failure(input, target, d, {
          normalizedInput: p.validation.normalized,
        });
      return finalize(
        {
          input: inputAsString(input),
          normalizedInput: p.sidc,
          output: p.sidc,
          sourceStandard: "MIL-STD-2525C",
          targetStandard: target,
          matchQuality: "exact",
          success: true,
          warnings: [],
          errors: [],
          diagnostics: [],
          mappingSource: "identity",
        },
        d,
      );
    }
    case "APP-6C":
      return unsupportedTarget(
        input,
        target,
        "APP-6(C) output is not supported: it uses the 20-digit numeric SIDC with version 10 (shared with 2525D and APP-6(D)) and no APP-6(C) catalog was available to verify codes against.",
      );
    default:
      return unsupportedTarget(
        input,
        target,
        `Unknown target standard "${String(target)}".`,
      );
  }
}

export const ALL_TARGETS: readonly SidcStandard[] = [
  "LEGACY-12",
  "MIL-STD-2525D",
  "APP-6D",
  "MIL-STD-2525E",
  "APP-6E",
  "APP-6C",
];

/** Converts to every target; each result stands on its own. */
export function convertSidcToAll(
  input: unknown,
  options: Omit<ConversionOptions, "targetStandard"> = {},
): Record<string, ConversionResult> {
  const out: Record<string, ConversionResult> = {};
  for (const t of ALL_TARGETS)
    out[t] = convertSidc(input, { ...options, targetStandard: t });
  return out;
}
