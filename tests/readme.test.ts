import { describe, expect, it } from "vitest";
import {
  convertSidc,
  convertSidc15To12,
  convertSidc15To2525D,
  convertSidc15ToApp6D,
  validateSidc,
} from "../src";

// Keeps the README examples honest: every value shown there is asserted here.
describe("README examples", () => {
  it("numeric", () => {
    const r = convertSidc15To2525D("SFGPUCIC---E---");
    expect([r.output, r.matchQuality, r.confidence]).toEqual([
      "10031000151211000002",
      "exact",
      "corroborated",
    ]);
    expect(r.metadata?.entity).toBe("Movement and Maneuver : Infantry");
    expect(r.metadata?.modifiers).toEqual(["Arctic"]);
    const a = convertSidc15ToApp6D("SFGPUCIC---E---");
    expect([a.output, a.matchQuality]).toEqual([
      "10031000151211000002",
      "equivalent",
    ]);
  });
  it("12-character and wildcards", () => {
    expect(convertSidc15To12("SFGPUCIC---E---").output).toBe("SFGPUCIC---E");
    const t = convertSidc15To2525D("S*GPUCI---*****");
    expect([t.success, t.matchQuality, t.ambiguousPositions]).toEqual([
      false,
      "ambiguous",
      [2, 11, 12],
    ]);
    expect(
      convertSidc15To2525D("S*GPUCI---*****", {
        affiliation: "H",
        symbolModifier: "-E",
      }).output,
    ).toBe("10061000151211000000");
    expect(
      convertSidc15To12("S*GPUCI---*****", { wildcardPolicy: "preserve" })
        .output,
    ).toBe("S*GPUCI---**");
  });
  it("lossy", () => {
    const s = convertSidc15To2525D("SFGPUCIC---EUS-");
    expect([s.success, s.matchQuality, s.candidates?.[0]?.output]).toEqual([
      false,
      "lossy",
      "10031000151211000002",
    ]);
    const ok = convertSidc15To2525D("SFGPUCIC---EUS-", { allowLossy: true });
    expect(ok.metadata?.droppedFields).toEqual({ countryCode: "US" });
  });
  it("unsupported and ambiguous", () => {
    expect(convertSidc15To2525D("SHGPUUSW-------").errors[0]).toMatch(
      /retired/,
    );
    expect(convertSidc15ToApp6D("IHAPSRE--------").matchQuality).toBe(
      "unsupported",
    );
    expect(convertSidc("SFGPUCVRW------").matchQuality).toBe("ambiguous");
    expect(
      convertSidc("SFGPUCVRW------", { preferredSource: "JMSML" }).output,
    ).toBe("10031000001206007400");
    expect(validateSidc("SFGPIXH--------").errors[0]).toMatch(
      /Did you mean SFGPIXH---H----\?/,
    );
  });
});
