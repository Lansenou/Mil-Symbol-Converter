/**
 * What kind of identifier a string is, and the shared first step of the converters that start
 * from any SIDC: numeric codes go to 2525C, then missing fields are filled for drawing.
 */
import { convertNumericTo2525C } from "./converters/reverse";
import type { DiagnosticList } from "./diagnostics";
import { toRenderableSidc, type RenderableSidc } from "./render";

/**
 * "2525C": a letter SIDC (validity is not checked here); "numeric": a 20- or 30-digit SIDC;
 * "dis": a DIS entity or aggregate type such as "1.1.225.1"; "cot": a Cursor on Target atom type.
 */
export type InputKind = "2525C" | "numeric" | "dis" | "cot";

const NUMERIC = /^\d{20}(\d{10})?$/;
const DIS = /^\d{1,5}(\.\d{1,5}){1,6}$/;
const COT = /^a-[a-z.]-/i;

/** The kind of identifier, or null for anything that is not a non-empty string. */
export function detectInput(input: unknown): InputKind | null {
  if (typeof input !== "string") return null;
  const s = input.trim();
  if (!s) return null;
  if (NUMERIC.test(s)) return "numeric";
  if (DIS.test(s)) return "dis";
  if (COT.test(s)) return "cot";
  return "2525C";
}

/**
 * A complete 2525C code from a letter or numeric SIDC (as `toRenderableSidc`), with its
 * diagnostics added to `d`; null if there is none.
 */
export function complete2525C(
  input: unknown,
  d: DiagnosticList,
): RenderableSidc | null {
  let letters = input;
  if (detectInput(input) === "numeric") {
    const r = convertNumericTo2525C((input as string).trim());
    if (!r.output) {
      d.extend(r.diagnostics);
      return null;
    }
    letters = r.output;
  }
  const r = toRenderableSidc(letters);
  d.extend(r.diagnostics);
  return r.sidc ? r : null;
}
