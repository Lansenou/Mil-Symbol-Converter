/**
 * Compile-time checking of SIDC string literals.
 *
 * Functions that take a SIDC (`convertSidc`, `useSidcConverter`, ...) check string literals
 * against the MIL-STD-2525C tables at the type level. A bad literal is a type error whose
 * message names the position and the reason:
 *
 *   convertSidc("SHGPUCX--------");
 *   // Argument of type '"SHGPUCX--------"' is not assignable to parameter of type
 *   // '"✗ SIDC position 7: \"UCX---\" is not a 2525C function ID for scheme S, dimension G"'.
 *
 * Only literals are checked; a `string` (from data, forms, ...) passes and is validated at
 * runtime as before. Opting out:
 * - per call: pass a `string`, e.g. `convertSidc(code as string)`;
 * - everywhere: augment `TypeOptions` once in your project:
 *
 *     declare module "mil-symbol-converter" {
 *       interface TypeOptions { checkSidcLiterals: false }
 *     }
 *
 * The check is stricter than the runtime: it wants the canonical form (uppercase ASCII, no
 * typographic dashes or surrounding whitespace) that a literal in source code should have.
 */
import type {
  AffiliationChar,
  FunctionIds,
  MetocSidc,
  SchemeTables,
} from "./sidc-literal-tables";

/** Augment with `{ checkSidcLiterals: false }` to turn the literal check off project-wide. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TypeOptions {}

type CheckEnabled = TypeOptions extends { checkSidcLiterals: false }
  ? false
  : true;

type Upper =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  | "P"
  | "Q"
  | "R"
  | "S"
  | "T"
  | "U"
  | "V"
  | "W"
  | "X"
  | "Y"
  | "Z";
type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

type Err<
  P extends string | number,
  M extends string,
> = `✗ SIDC ${P extends `${string}-${string}` ? "positions" : "position"} ${P}: ${M}`;

type Length<
  S extends string,
  N extends 0[] = [],
> = S extends `${string}${infer R}` ? Length<R, [...N, 0]> : N["length"];
/** Only built for the error message, so valid literals never pay for counting. */
type LengthError<S extends string> =
  `✗ SIDC: a 2525C SIDC has 15 characters, "${S}" has ${Length<S>}`;

type AllDigits<S extends string> = S extends `${Digit}${infer R}`
  ? AllDigits<R>
  : S extends ""
    ? true
    : false;

/** Position (5-10) of the first function-ID character no listed ID continues. */
type FirstBadFn<
  F extends string,
  U extends string,
  Acc extends string = "",
  P extends number[] = [5, 6, 7, 8, 9, 10],
> = F extends `${infer C}${infer R}`
  ? [Extract<U, `${Acc}${C}${string}`>] extends [never]
    ? P[0]
    : P extends [number, ...infer Rest extends number[]]
      ? FirstBadFn<R, U, `${Acc}${C}`, Rest>
      : 10
  : 10;

type Wild<C extends string> = C | "*";

type CheckLetterSidc<S extends string> =
  S extends `${infer Sc}${infer Af}${infer Di}${infer St}${infer F1}${infer F2}${infer F3}${infer F4}${infer F5}${infer F6}${infer M1}${infer M2}${infer C1}${infer C2}${infer Ob}${infer Rest}`
    ? Rest extends ""
      ? Sc extends keyof SchemeTables
        ? Af extends Wild<AffiliationChar>
          ? Di extends SchemeTables[Sc]["dimension"]
            ? St extends Wild<SchemeTables[Sc]["status"]>
              ? `${F1}${F2}${F3}${F4}${F5}${F6}` extends FunctionIds[`${Sc}${Di}` &
                  keyof FunctionIds]
                ? `${M1}${M2}` extends
                    SchemeTables[Sc]["modifier"] | `*${string}` | `${string}*`
                  ? `${C1}${C2}` extends
                      | `${Upper}${Upper}`
                      | "--"
                      | "**"
                      | `*${string}`
                      | `${string}*`
                    ? Ob extends Wild<SchemeTables[Sc]["orderOfBattle"]> | "-"
                      ? true
                      : Err<
                          15,
                          `"${Ob}" is not an order of battle for scheme ${Sc}`
                        >
                    : Err<
                        C1 extends Upper ? 14 : 13,
                        `country code "${C1}${C2}" must be two letters, "--" or "**"`
                      >
                  : Err<
                      `${M1}-` extends SchemeTables[Sc]["modifier"]
                        ? 12
                        : `-${M2}` extends SchemeTables[Sc]["modifier"]
                          ? 11
                          : "11-12",
                      `"${M1}${M2}" is not a symbol modifier for scheme ${Sc}`
                    >
                : Err<
                    FirstBadFn<
                      `${F1}${F2}${F3}${F4}${F5}${F6}`,
                      FunctionIds[`${Sc}${Di}` & keyof FunctionIds]
                    >,
                    `"${F1}${F2}${F3}${F4}${F5}${F6}" is not a 2525C function ID for scheme ${Sc}, dimension ${Di}`
                  >
              : Err<4, `"${St}" is not a status for scheme ${Sc}`>
            : Err<3, `"${Di}" is not a dimension/category for scheme ${Sc}`>
          : Err<2, `"${Af}" is not a standard identity`>
        : Sc extends "W"
          ? S extends MetocSidc
            ? true
            : Err<"5-15", `"${S}" is not a 2525C METOC SIDC`>
          : Err<1, `"${Sc}" is not a coding scheme (S, G, W, I, O, E)`>
      : LengthError<S>
    : LengthError<S>;

/**
 * `true` for a valid SIDC literal (15-character 2525C, or a 20/30-digit numeric code, which is
 * checked at runtime), otherwise the error message as a string literal type.
 */
type HeaderKey = {
  [
    Sc in keyof SchemeTables
  ]: `${Sc}${Wild<AffiliationChar>}${SchemeTables[Sc]["dimension"]}${Wild<SchemeTables[Sc]["status"]>}`;
}[keyof SchemeTables];
type FnKey = {
  [K in keyof FunctionIds]: `${K}${FunctionIds[K]}`;
}[keyof FunctionIds];
type ModKey = {
  [Sc in keyof SchemeTables]: `${Sc}${SchemeTables[Sc]["modifier"]}`;
}[keyof SchemeTables];
type ObKey = {
  [
    Sc in keyof SchemeTables
  ]: `${Sc}${Wild<SchemeTables[Sc]["orderOfBattle"]> | "-"}`;
}[keyof SchemeTables];
type CountryKey = `${Upper}${Upper}` | "--" | "**";

/** One flat comparison for the common (valid) case; the detailed walk only runs on failure. */
type FastLetter<S extends string> =
  S extends `${infer Sc}${infer Af}${infer Di}${infer St}${infer F1}${infer F2}${infer F3}${infer F4}${infer F5}${infer F6}${infer M1}${infer M2}${infer C1}${infer C2}${infer Ob}${infer Rest}`
    ? [
        Rest,
        `${Sc}${Af}${Di}${St}`,
        `${Sc}${Di}${F1}${F2}${F3}${F4}${F5}${F6}`,
        `${Sc}${M1}${M2}`,
        `${C1}${C2}`,
        `${Sc}${Ob}`,
      ] extends [
        "",
        HeaderKey,
        FnKey,
        ModKey | `${string}*${string}`,
        CountryKey | `${string}*${string}`,
        ObKey,
      ]
      ? true
      : CheckLetterSidc<S>
    : CheckLetterSidc<S>;

export type ValidateSidcLiteral<S extends string> =
  S extends `${Digit}${string}`
    ? AllDigits<S> extends true
      ? Length<S> extends 20 | 30
        ? true
        : `✗ SIDC: a numeric SIDC has 20 or 30 digits, "${S}" has ${Length<S>}`
      : LengthError<S>
    : S extends MetocSidc
      ? true
      : FastLetter<S>;

/**
 * Parameter type of SIDC inputs: a valid literal passes as itself, a bad literal becomes the
 * error message (so the compiler shows it), anything that is not a literal passes unchanged.
 */
/** True for a fully known string literal; false for `string` and patterns like `S${string}`. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- {} is the point: only index signatures accept it
type IsLiteral<S extends string> = {} extends Record<S, 1> ? false : true;

export type CheckedSidc<S> = CheckEnabled extends false
  ? S
  : S extends string
    ? IsLiteral<S> extends false
      ? S
      : ValidateSidcLiteral<S> extends true
        ? S
        : ValidateSidcLiteral<S>
    : S;

/** Identity function that checks a SIDC literal at compile time: `const s = sidc("SHGPUCI--------")`. */
export function sidc<const S extends string>(value: CheckedSidc<S>): S {
  return value as S;
}
