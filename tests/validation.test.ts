import { describe, expect, it } from "vitest";
import { validateSidc } from "../src";

const codes = (r: ReturnType<typeof validateSidc>) =>
  r.diagnostics.map((d) => d.code);

describe("input validation", () => {
  it("accepts a concrete 2525C SIDC and finds its table row", () => {
    const r = validateSidc("SFGPUCIC---E---");
    expect(r.valid).toBe(true);
    expect(r.normalized).toBe("SFGPUCIC---E---");
    expect(r.isTemplate).toBe(false);
    expect(r.catalogEntry?.description).toBe("INFANTRY ARCTIC");
    expect(r.errors).toEqual([]);
  });

  it.each([
    ["", "EMPTY_INPUT"],
    [null, "INVALID_TYPE"],
    [undefined, "INVALID_TYPE"],
    [123456789012345, "INVALID_TYPE"],
    [{}, "INVALID_TYPE"],
  ])("rejects %j", (input, code) => {
    const r = validateSidc(input);
    expect(r.valid).toBe(false);
    expect(codes(r)).toContain(code);
    expect(r.normalized).toBeNull();
  });

  it.each(["SFGPUCI", "SFGPUCIC---E", "SFGPUCIC---E----", "SFGPUCIC---E---X"])(
    "rejects wrong length %s",
    (s) => {
      const r = validateSidc(s);
      expect(r.valid).toBe(false);
      expect(codes(r)).toContain("INVALID_LENGTH");
    },
  );

  it("explains that a 20-digit numeric SIDC is not a 2525C input", () => {
    const r = validateSidc("10031000151211000002");
    expect(r.errors[0]).toMatch(/numeric/);
  });

  it("normalizes lowercase and surrounding whitespace with warnings", () => {
    const r = validateSidc("  sfgpucic---e---\n");
    expect(r.valid).toBe(true);
    expect(r.normalized).toBe("SFGPUCIC---E---");
    expect(codes(r)).toEqual(
      expect.arrayContaining(["WHITESPACE_TRIMMED", "LOWERCASE_NORMALIZED"]),
    );
  });

  it("rejects lowercase and whitespace in strictInput mode", () => {
    expect(validateSidc("sfgpucic---e---", { strictInput: true }).valid).toBe(
      false,
    );
    expect(validateSidc(" SFGPUCIC---E---", { strictInput: true }).valid).toBe(
      false,
    );
  });

  it("rejects internal whitespace and invalid characters with positions", () => {
    const r = validateSidc("SFGP UCIC--E---");
    expect(r.valid).toBe(false);
    expect(r.diagnostics[0]?.positions).toEqual([5]);
    expect(validateSidc("SFGPUCIC_--E---").valid).toBe(false);
  });

  it("rejects unexpected Unicode, including typographic dashes and length-changing letters", () => {
    const dash = validateSidc("SFGPUCIC———E———");
    expect(dash.valid).toBe(false);
    expect(dash.errors[0]).toMatch(/typographic dashes/);
    // "ß".toUpperCase() is "SS": must not be uppercased into a valid-length string.
    expect(validateSidc("SFGPUCIC---E--ß").valid).toBe(false);
    expect(validateSidc("ＳFGPUCIC---E---").valid).toBe(false);
  });

  it("rejects strings with leading zeros / digits in the coding scheme", () => {
    const r = validateSidc("000PUCIC---E---");
    expect(r.valid).toBe(false);
    expect(codes(r)).toContain("INVALID_CODING_SCHEME");
  });

  it.each([
    ["SXGPUCI--------", 2, "standard identity not in Table A-I"],
    ["S-GPUCI--------", 2, "'-' is not a standard identity"],
    ["SFQPUCI--------", 3, "Q is not a battle dimension"],
    ["SFGQUCI--------", 4, "Q is not a status"],
    ["SFGPUCI---ZZ---", 11, "ZZ is not in Table A-II"],
    ["SFGPUCI-----U1-", 13, "country code must be letters"],
    ["SFGPUCI-------Q", 15, "Q is not an order of battle"],
    ["SFGPU-I--------", 5, "function ID not filled left to right"],
  ])("rejects invalid field value in %s (position %i: %s)", (s, pos) => {
    const r = validateSidc(s);
    expect(r.valid).toBe(false);
    expect(r.diagnostics.some((d) => d.positions?.includes(pos))).toBe(true);
  });

  describe("valid values in invalid combinations", () => {
    it("status C (fully capable) is not a tactical-graphic status (Table B-I)", () => {
      expect(validateSidc("GFGCGLB-------X").valid).toBe(false);
    });
    it("mobility is not a tactical-graphic modifier (Table B-II has echelons only)", () => {
      expect(validateSidc("GFGPGLB---MO--X").valid).toBe(false);
    });
    it("echelons are not used by signals intelligence (Table D-I)", () => {
      expect(validateSidc("IHAPSRE---A----").valid).toBe(false);
    });
    it("echelons are not in the emergency management modifier table (Table G-II)", () => {
      expect(validateSidc("EFIPA-----E----").valid).toBe(false);
    });
    it("an installation code requires H in position 11", () => {
      const r = validateSidc("SFGPIXH--------");
      expect(r.valid).toBe(false);
      expect(codes(r)).toContain("INSTALLATION_INDICATOR_REQUIRED");
      expect(r.errors[0]).toMatch(/SFGPIXH---H----/);
    });
    it("H in position 11 is rejected for a unit", () => {
      const r = validateSidc("SFGPUCI---H----");
      expect(codes(r)).toContain("INSTALLATION_INDICATOR_NOT_APPLICABLE");
    });
    it("METOC graphic type must be P--, -L- or --A", () => {
      expect(validateSidc("WAS-PL----Q----").valid).toBe(false);
    });
  });

  it("accepts tactical graphics with '-' instead of 'X' in position 15, with a warning", () => {
    const r = validateSidc("GFTPA----------");
    expect(r.valid).toBe(true);
    expect(codes(r)).toContain("NONSTANDARD_ORDER_OF_BATTLE");
  });

  it("warns (does not fail) for a well-formed code missing from the 2525C tables", () => {
    const r = validateSidc("SFGPUCQQQQ-----");
    expect(r.valid).toBe(true);
    expect(codes(r)).toContain("NOT_IN_2525C_TABLES");
  });

  describe("wildcard templates", () => {
    it("recognizes S*GPUCI---***** as a template", () => {
      const r = validateSidc("S*GPUCI---*****");
      expect(r.valid).toBe(true);
      expect(r.isTemplate).toBe(true);
      expect(r.wildcardPositions).toEqual([2, 11, 12, 13, 14, 15]);
      expect(r.catalogEntry?.template).toBe("S*G*UCI---*****");
    });
    it("rejects * outside the user-defined positions", () => {
      expect(validateSidc("SFGPUC*--------").valid).toBe(false);
      expect(validateSidc("*FGPUCI--------").valid).toBe(false);
      expect(validateSidc("WAS-PL----P---*").valid).toBe(false);
    });
    it("rejects partial wildcards that no table value completes", () => {
      expect(validateSidc("SFGPUCI---Z*---").valid).toBe(false);
      expect(validateSidc("SFGPUCI----*---").valid).toBe(true);
    });
  });
});
