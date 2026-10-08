import { describe, expect, it } from "vitest";
import { convertLetterSidc2NumberSidc } from "@orbat-mapper/convert-symbology";
import { analyzeSidc, convertSidc, convertSidc15To2525D } from "../src";

describe("regression: SFGPUCIC---E--- / 10031000151211000002", () => {
  // Verified against the standards, field by field (see tests/fixtures/verified-sidcs.json):
  //   2525C Table A-III: S * G * UC IC -- = INFANTRY ARCTIC; "-E" = company (Table A-II)
  //   2525D: 10 version | 03 reality+friend | 10 land unit | 0 present | 0 | 15 company |
  //          121100 Infantry (Table A-XIX) | 00 | 02 Arctic (Table A-XXI)
  it("converts to the independently verified code", () => {
    const r = convertSidc15To2525D("SFGPUCIC---E---");
    expect(r.output).toBe("10031000151211000002");
    expect(r.matchQuality).toBe("exact");
    expect(r.confidence).toBe("corroborated");
  });

  it("agrees with @orbat-mapper/convert-symbology for this concrete code", () => {
    expect(convertLetterSidc2NumberSidc("SFGPUCIC---E---").sidc).toBe(
      "10031000151211000002",
    );
  });
});

describe("regression: S*GPUCI---*****", () => {
  it("is a generic template whose user-defined positions are 2 and 11-15", () => {
    const a = analyzeSidc("S*GPUCI---*****");
    expect(a.isTemplate).toBe(true);
    expect(a.validation.catalogEntry).toMatchObject({
      template: "S*G*UCI---*****",
      description: "INFANTRY",
    });
    expect(a.wildcards.map((w) => w.option)).toEqual([
      "affiliation",
      "symbolModifier",
      "countryCode",
      "orderOfBattle",
    ]);
    expect(a.wildcards[0]?.alternatives).toBe(14);
  });

  it("has no unique numeric counterpart (14 standard identities x 135 modifiers)", () => {
    expect(convertSidc("S*GPUCI---*****").output).toBeNull();
  });

  it("differs from convert-symbology, which silently substitutes Friend for *", () => {
    // Documented difference: the other library replaces "*" with "-" and defaults to Friend.
    expect(convertLetterSidc2NumberSidc("S*GPUCI---*****").sidc).toBe(
      "10031000001211000000",
    );
    expect(convertSidc("S*GPUCI---*****").success).toBe(false);
  });
});

describe("regression: silent defaults found in other converters are not reproduced", () => {
  it("'-' in the standard identity is invalid, not Friend", () => {
    expect(convertLetterSidc2NumberSidc("S-GPUCI--------").sidc).toBe(
      "10031000001211000000",
    );
    expect(convertSidc("S-GPUCI--------").success).toBe(false);
  });

  it("a symbol with no counterpart is not replaced by the closest one", () => {
    const other = convertLetterSidc2NumberSidc("SHGPUUSW-------");
    expect(other.match).not.toBe("exact");
    const r = convertSidc("SHGPUUSW-------");
    expect(r.output).toBeNull();
    expect(r.matchQuality).toBe("unsupported");
  });
});
