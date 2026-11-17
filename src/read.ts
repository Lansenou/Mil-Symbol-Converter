/**
 * One entry point for any identifier: a 2525C letter SIDC, a numeric 2525D/E or APP-6D/E SIDC,
 * a DIS entity or aggregate type, or a Cursor on Target type, read as a 2525C SIDC.
 */
import { convertNumericTo2525C } from "./converters/reverse";
import { cotToSidc } from "./cot";
import { DiagnosticList } from "./diagnostics";
import { disToSidc } from "./dis";
import { detectInput, type InputKind } from "./input";
import { validateSidc } from "./validation";
import type { Diagnostic, MatchQuality } from "./types";

export interface ReadSidcOptions {
  /** For DIS input: the Force ID (sets the affiliation). */
  forceId?: number;
  /** For DIS input: read it as an aggregate type (a unit). */
  aggregate?: boolean;
}

export interface ReadSidcResult {
  input: unknown;
  /** What the input was read as, or null if it is not a non-empty string. */
  kind: InputKind | null;
  /** The 2525C SIDC (it may contain "*"; `toRenderableSidc` fills those), or null. */
  output: string | null;
  matchQuality: MatchQuality;
  /** What the input said that the 2525C code leaves out. */
  lost: string[];
  diagnostics: Diagnostic[];
}

/** Reads any supported identifier as a 2525C SIDC. */
export function readSidc(
  input: unknown,
  options: ReadSidcOptions = {},
): ReadSidcResult {
  const kind = detectInput(input);
  const result = (
    output: string | null,
    matchQuality: MatchQuality,
    lost: string[],
    diagnostics: Diagnostic[],
  ): ReadSidcResult => ({
    input,
    kind,
    output,
    matchQuality,
    lost,
    diagnostics,
  });
  const s = typeof input === "string" ? input.trim() : "";
  switch (kind) {
    case "numeric": {
      const r = convertNumericTo2525C(s);
      return result(r.output, r.matchQuality, r.lost, r.diagnostics);
    }
    case "dis": {
      const r = disToSidc(s, options);
      return result(r.output, r.matchQuality, r.lost, r.diagnostics);
    }
    case "cot": {
      const r = cotToSidc(s);
      return result(r.output, r.matchQuality, r.lost, r.diagnostics);
    }
    case "2525C": {
      const r = validateSidc(input);
      return result(
        r.normalized && r.fields ? r.normalized : null,
        r.valid ? "exact" : "unsupported",
        [],
        r.diagnostics,
      );
    }
    default: {
      const d = new DiagnosticList();
      d.error(
        "INVALID_TYPE",
        "Expected a SIDC, a DIS entity type or a Cursor on Target type, as a string.",
      );
      return result(null, "unsupported", [], d.items);
    }
  }
}
