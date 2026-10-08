import { describe, expect, it } from "vitest";
import { convertSidc15To12, LEGACY12_PROFILES } from "../src";

describe("15 -> 12 character form (profile prefix-12)", () => {
  it("is the only defined profile", () => {
    expect(Object.keys(LEGACY12_PROFILES)).toEqual(["prefix-12"]);
  });

  it("keeps positions 1-12 when 13-15 carry no information", () => {
    const r = convertSidc15To12("SFGPUCIC---E---");
    expect(r).toMatchObject({
      output: "SFGPUCIC---E",
      matchQuality: "exact",
      success: true,
    });
    expect(r.mappingSource).toBe("profile:prefix-12");
  });

  it("treats the fixed X of tactical graphics as carrying no information", () => {
    expect(convertSidc15To12("GFTPA---------X").matchQuality).toBe("exact");
  });

  it("reports country code and order of battle loss; strict by default", () => {
    const strict = convertSidc15To12("SFGPUCIC---EUSG");
    expect(strict.success).toBe(false);
    expect(strict.output).toBeNull();
    expect(strict.matchQuality).toBe("lossy");
    expect(strict.candidates?.[0]?.output).toBe("SFGPUCIC---E");
    const ok = convertSidc15To12("SFGPUCIC---EUSG", { allowLossy: true });
    expect(ok.output).toBe("SFGPUCIC---E");
    expect(ok.metadata?.droppedFields).toEqual({
      countryCode: "US",
      orderOfBattle: "G",
    });
  });

  it("reports METOC graphic-type loss when position 13 is significant", () => {
    const r = convertSidc15To12("WA-DBAIF----A--", { allowLossy: true });
    expect(r.matchQuality).toBe("lossy");
    expect(r.metadata?.droppedFields).toEqual({ graphicType: "--A" });
  });

  it("rejects invalid input", () => {
    expect(convertSidc15To12("SFGPUCIC---E").success).toBe(false);
    expect(convertSidc15To12("SFGPUCIC---E--?").success).toBe(false);
  });

  it("rejects an unknown profile", () => {
    const r = convertSidc15To12("SFGPUCIC---E---", {
      legacy12Profile: "fbcb2",
    });
    expect(r.success).toBe(false);
    expect(r.matchQuality).toBe("unsupported");
  });

  it("is deterministic and always 12 characters", () => {
    const a = convertSidc15To12("SHAPMFB--------");
    const b = convertSidc15To12("SHAPMFB--------");
    expect(a).toEqual(b);
    expect(a.output).toHaveLength(12);
  });
});
