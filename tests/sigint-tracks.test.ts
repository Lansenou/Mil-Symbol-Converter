import { describe, expect, it } from "vitest";
import { convertSidc, validateSidc } from "../src";

describe('"-" in position 4', () => {
  it("is read as * (any status) with a warning", () => {
    const v = validateSidc("I*P-------*****");
    expect(v.valid).toBe(true);
    expect(v.normalized).toBe("I*P*--------***");
    expect(v.catalogEntry?.description).toBe("SPACE TRACK");
    expect(v.diagnostics.map((d) => d.code)).toContain(
      "STATUS_DASH_AS_WILDCARD",
    );
  });

  it("is kept in scheme headings, METOC codes and strict input", () => {
    expect(validateSidc("S---------*****").normalized).toBe("S---------*****");
    expect(validateSidc("WAS-PL----P----").normalized).toBe("WAS-PL----P----");
    expect(validateSidc("SFG-UCI--------", { strictInput: true }).valid).toBe(
      false,
    );
  });
});

describe("SIGINT track headings", () => {
  it.each([
    ["IHPP-----------", "10065000000000000000"],
    ["IHAP-----------", "10065100000000000000"],
    ["IFGP-----------", "10035200000000000000"],
    ["IHSP-----------", "10065300000000000000"],
    ["IHUP-----------", "10065400000000000000"],
  ])("%s draws the bare SIGINT frame %s (lossy)", (sidc, out) => {
    const strict = convertSidc(sidc);
    expect(strict.output).toBeNull();
    expect(strict.candidates?.[0]?.output).toBe(out);
    const r = convertSidc(sidc, { allowLossy: true });
    expect(r.output).toBe(out);
    expect(r.matchQuality).toBe("lossy");
    expect(r.diagnostics.map((d) => d.code)).toContain("FRAME_ONLY");
  });

  it("is not offered where the edition has no such SIGINT symbol set", () => {
    const r = convertSidc("IHPP-----------", {
      targetStandard: "APP-6D",
      allowLossy: true,
    });
    expect(r.output).toBeNull();
  });

  it("leaves mapped SIGINT symbols alone", () => {
    expect(
      convertSidc("IHPPSCD--------", { allowLossy: true }).matchQuality,
    ).not.toBe("lossy");
  });
});
