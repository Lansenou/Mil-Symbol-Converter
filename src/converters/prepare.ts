/**
 * Shared input stage of every conversion: validation, wildcard policy and resolution.
 */
import type {
  ConversionOptions,
  SidcStandard,
  ValidationResult,
} from "../types";
import { DiagnosticList } from "../diagnostics";
import { validateSidc } from "../validation";
import {
  resolveWildcards,
  wildcardFields,
  type WildcardResolution,
} from "../wildcard";

export interface PreparedInput {
  ok: boolean;
  /** Validated SIDC after wildcard resolution (may still contain "*"). */
  sidc: string | null;
  validation: ValidationResult;
  resolution?: WildcardResolution | undefined;
  /** Wildcard positions left unresolved. */
  unresolvedPositions: number[];
}

/**
 * @param supportsWildcards whether the target format can carry "*" (only LEGACY-12 can).
 */
export function prepareInput(
  input: unknown,
  options: ConversionOptions,
  target: SidcStandard,
  supportsWildcards: boolean,
  d: DiagnosticList,
): PreparedInput {
  if (options.sourceStandard && options.sourceStandard !== "MIL-STD-2525C") {
    d.error(
      "UNSUPPORTED_SOURCE",
      `Only MIL-STD-2525C letter SIDCs are supported as input; sourceStandard was "${options.sourceStandard}".`,
    );
  }
  const validation = validateSidc(input, options);
  d.extend(validation.diagnostics);
  const fail = (): PreparedInput => ({
    ok: false,
    sidc: validation.normalized,
    validation,
    unresolvedPositions: validation.wildcardPositions,
  });
  if (!validation.valid || validation.normalized === null || d.hasErrors())
    return fail();

  const policy = options.wildcardPolicy ?? "resolve";
  if (!validation.isTemplate) {
    // Options meant for wildcards must not silently override concrete input.
    const r = resolveWildcards(validation.normalized, options);
    d.extend(r.diagnostics);
    return {
      ok: true,
      sidc: validation.normalized,
      validation,
      unresolvedPositions: [],
    };
  }

  if (policy === "reject") {
    d.error(
      "WILDCARD_REJECTED",
      `The input is a template with "*" at position(s) ${validation.wildcardPositions.join(", ")} and wildcardPolicy is "reject".`,
      validation.wildcardPositions,
    );
    return fail();
  }

  let sidc = validation.normalized;
  let resolution: WildcardResolution | undefined;
  if (policy === "resolve") {
    resolution = resolveWildcards(sidc, options);
    d.extend(resolution.diagnostics);
    if (resolution.diagnostics.some((x) => x.severity === "error"))
      return fail();
    if (resolution.resolved.length > 0) {
      // The substituted values must be valid for this SIDC as well.
      const again = validateSidc(resolution.sidc, { strictInput: true });
      const errs = again.diagnostics.filter((x) => x.severity === "error");
      if (errs.length > 0) {
        for (const e of errs) {
          d.error(
            "INVALID_RESOLUTION_VALUE",
            `After substituting the supplied values: ${e.message}`,
            e.positions,
          );
        }
        return fail();
      }
      sidc = resolution.sidc;
      d.info(
        "WILDCARDS_RESOLVED",
        `Resolved ${resolution.resolved.map((r) => `positions ${r.positions.join("-")} = "${r.value}"`).join(", ")} from the supplied options.`,
        resolution.resolved.flatMap((r) => r.positions),
      );
    }
  }

  const unresolvedPositions = wildcardFields(sidc).flatMap((f) =>
    f.positions.filter((p) => sidc[p - 1] === "*"),
  );
  if (unresolvedPositions.length > 0 && supportsWildcards) {
    d.warn(
      "TEMPLATE_OUTPUT",
      `Wildcard position(s) ${unresolvedPositions.join(", ")} are kept; the ${target} output is a template, not a concrete symbol.`,
      unresolvedPositions,
    );
  }
  return { ok: true, sidc, validation, resolution, unresolvedPositions };
}
