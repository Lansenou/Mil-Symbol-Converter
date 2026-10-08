import { describe, expect, it } from "vitest";
import fc from "fast-check";
import catalog from "../src/data/mil-std-2525c-catalog.json";
import {
  convertSidc,
  convertSidc15To2525D,
  convertSidc15To2525E,
  validateSidc,
} from "../src";
import {
  TIERS,
  TIER_PRECISION,
  calibratedCertainty,
  dice,
  words,
} from "../src/converters/fuzzy";

describe("fuzzy mode is opt-in", () => {
  it("strict mode does not guess", () => {
    const r = convertSidc15To2525D("SFGPUUL--------");
    expect(r.success).toBe(false);
    expect(r.fuzzy).toBeUndefined();
  });

  it("name-match: LAW ENFORCEMENT UNIT -> Land unit Law Enforcement, approximate with certainty", () => {
    const r = convertSidc15To2525D("SFGPUUL--------", { fuzzy: true });
    expect(r.success).toBe(true);
    expect(r.output).toBe("10031000002000000000");
    expect(r.matchQuality).toBe("approximate");
    expect(r.fuzzy).toMatchObject({ method: "name-match" });
    expect(r.fuzzy!.certainty).toBeCloseTo(TIER_PRECISION[0]!, 5);
    expect(r.diagnostics.map((d) => d.code)).toContain("FUZZY_RESULT");
  });

  it("source-choice settles a source disagreement by name (rime icing swap)", () => {
    const strict = convertSidc15To2525D("WAS-IRM---P----");
    expect(strict.matchQuality).toBe("ambiguous");
    const r = convertSidc15To2525D("WAS-IRM---P----", { fuzzy: true });
    expect(r.fuzzy?.method).toBe("source-choice");
    expect(r.output).toBe("10004500001302020000"); // Icing : Rime Icing : Moderate
  });

  it("ancestor fallback is lossy and needs allowLossy", () => {
    const blocked = convertSidc15To2525D("SFAPMFFI-------", { fuzzy: true });
    expect(blocked.success).toBe(false);
    expect(blocked.matchQuality).toBe("lossy");
    expect(blocked.candidates?.[0]?.output).toBe("10030100001101040000");
    const r = convertSidc15To2525D("SFAPMFFI-------", {
      fuzzy: true,
      allowLossy: true,
    });
    expect(r.output).toBe("10030100001101040000"); // FIGHTER, parent of INTERCEPTOR
    expect(r.fuzzy).toMatchObject({ method: "ancestor", certainty: 1 });
  });

  it("minCertainty can exclude name matches", () => {
    const r = convertSidc15To2525D("SFGPUUL--------", {
      fuzzy: true,
      minCertainty: 0.99,
    });
    expect(r.matchQuality === "approximate").toBe(false);
  });

  it("does not override invalid input, unresolved wildcards or contested codes", () => {
    expect(
      convertSidc("SFGPUUL-------Q" as string, { fuzzy: true }).success,
    ).toBe(false);
    expect(convertSidc("S*GPUUL--------", { fuzzy: true }).success).toBe(false);
    const contested = convertSidc("SFGPUCVRW------", {
      targetStandard: "APP-6D",
      preferredSource: "mil-sym-ts",
      fuzzy: true,
      allowLossy: true,
    });
    expect(contested.diagnostics.map((d) => d.code)).toContain(
      "CONTESTED_CODE",
    );
    expect(contested.success).toBe(false);
  });

  it("never upgrades an existing strict result", () => {
    const a = convertSidc15To2525D("SFGPUCIC---E---");
    const b = convertSidc15To2525D("SFGPUCIC---E---", { fuzzy: true });
    expect(b).toEqual(a);
  });
});

describe("calibration", () => {
  it("has one measured precision per tier, all in (0, 1)", () => {
    expect(TIER_PRECISION).toHaveLength(TIERS.length);
    for (const p of TIER_PRECISION) expect(p > 0 && p < 1).toBe(true);
    expect(calibratedCertainty(0.1, 0)).toBe(0);
  });
  it("word similarity ignores case, punctuation, plurals and stop words", () => {
    expect(dice(words("SUPPLY POINTS"), words("Supply Point"))).toBe(1);
    expect(
      dice(words("Command & Control Areas"), words("command and control area")),
    ).toBe(1);
  });
});

describe("fuzzy results across the 2525C tables", () => {
  const symbols = (catalog as string[][])
    .map(([t = ""]) => {
      const c = [...t];
      if (c[0] !== "W") {
        if (c[1] === "*") c[1] = "F";
        if (c[3] === "*") c[3] = "P";
        for (const i of [10, 11, 12, 13, 14])
          if (c[i] === "*") c[i] = i === 10 && t[10] === "H" ? "H" : "-";
      }
      return c.join("");
    })
    .filter((s) => validateSidc(s).valid);

  it("are always labelled approximate or lossy, carry certainty, and are well-formed", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...symbols),
        fc.constantFrom(
          "MIL-STD-2525D",
          "APP-6D",
          "MIL-STD-2525E",
          "APP-6E" as const,
        ),
        (s, t) => {
          const r = convertSidc(s, {
            targetStandard: t,
            fuzzy: true,
            allowLossy: true,
            extendedSidc: true,
          });
          if (r.fuzzy) {
            expect(["approximate", "lossy"]).toContain(r.matchQuality);
            expect(r.fuzzy.certainty).toBeGreaterThanOrEqual(0.7);
            expect(r.fuzzy.certainty).toBeLessThanOrEqual(1);
          }
          if (r.success) expect(r.output).toMatch(/^(\d{20}|\d{30})$/);
        },
      ),
      { numRuns: 300 },
    );
  });
});

describe("2525E extended (30-digit) SIDC", () => {
  it("needs extendedSidc for a common modifier", () => {
    expect(convertSidc15To2525E("SFAPMHA--------").success).toBe(false);
    const r = convertSidc15To2525E("SFAPMHA--------", { extendedSidc: true });
    // Rotary wing 110200 + common sector-1 modifier 06 "Attack/Strike" (indicator 1 in position 21)
    expect(r.output).toBe("150301000011020006001000000000");
    expect(r.output).toHaveLength(30);
    expect(r.matchQuality).toBe("equivalent");
    expect(r.diagnostics.map((d) => d.code)).toContain("RENUMBERED");
  });
  it("refuses when both modifiers would need the same sector", () => {
    expect(
      convertSidc15To2525E("SFAPMFCL-------", { extendedSidc: true }).success,
    ).toBe(false);
  });
});
