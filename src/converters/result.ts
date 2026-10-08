import type { ConversionResult, MatchQuality, SidcStandard } from "../types";
import { DiagnosticList } from "../diagnostics";

const ORDER: MatchQuality[] = [
  "exact",
  "equivalent",
  "lossy",
  "ambiguous",
  "unsupported",
];

/** The weaker of two match qualities. */
export function worst(a: MatchQuality, b: MatchQuality): MatchQuality {
  return ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b;
}

/** Echo of the caller's input for results; never throws, even for hostile objects. */
export function inputAsString(input: unknown): string {
  if (typeof input === "string") return input;
  try {
    return String(input);
  } catch {
    return Object.prototype.toString.call(input);
  }
}

export function failure(
  input: unknown,
  targetStandard: SidcStandard,
  d: DiagnosticList,
  extra: Partial<ConversionResult> = {},
): ConversionResult {
  return finalize(
    {
      input: inputAsString(input),
      normalizedInput: null,
      output: null,
      sourceStandard: "MIL-STD-2525C",
      targetStandard,
      matchQuality: "unsupported",
      success: false,
      warnings: [],
      errors: [],
      diagnostics: [],
      ...extra,
    },
    d,
  );
}

/** Copies diagnostics into the result and enforces the success invariants. */
export function finalize(
  r: ConversionResult,
  d: DiagnosticList,
): ConversionResult {
  r.diagnostics = [...d.items];
  r.errors = d.messages("error");
  r.warnings = d.messages("warning");
  if (r.errors.length > 0 || r.output === null) {
    r.success = false;
    r.output = null;
  }
  if (r.matchQuality === "ambiguous" || r.matchQuality === "unsupported") {
    r.success = false;
    r.output = null;
  }
  return r;
}
