import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { convertSidc, sidc, type ValidateSidcLiteral } from "../src";
import { generate } from "../scripts/build-literal-types";

// The type-level checks below are verified by `npm run typecheck` (tsc): every expect-error
// directive must have a type error under it, and the other lines must have none.
describe("SIDC literal types", () => {
  it("accepts valid literals, templates, numeric codes and plain strings", () => {
    const code: string = "anything";
    expect(sidc("SHGPUCI--------")).toBe("SHGPUCI--------");
    sidc("S*G*UCI---*****");
    sidc("GFTPA---------X");
    sidc("WAS-WSVE--P----");
    sidc("10031000151211000002");
    convertSidc(code);
    convertSidc(`S${code}GPUCI--------`);
  });

  it("rejects bad literals at compile time", () => {
    // @ts-expect-error position 7: UCX--- is not a function ID
    convertSidc("SHGPUCX--------");
    // @ts-expect-error position 2
    convertSidc("SQGPUCI--------");
    // @ts-expect-error 14 characters
    convertSidc("SHGPUCI-------");
    // @ts-expect-error position 12
    sidc("SHGPUCI----Z---");
    // @ts-expect-error lowercase literals should be written canonically
    sidc("shgpuci--------");
    expect(true).toBe(true);
  });

  it("names the position in the message", () => {
    const m: ValidateSidcLiteral<"SHGPUCX--------"> =
      '✗ SIDC position 7: "UCX---" is not a 2525C function ID for scheme S, dimension G';
    expect(m).toContain("position 7");
  });

  it("the generated tables are up to date", () => {
    expect(fs.readFileSync("src/sidc-literal-tables.ts", "utf8")).toBe(
      generate(),
    );
  });
});
