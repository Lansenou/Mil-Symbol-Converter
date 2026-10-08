import { describe, expect, it } from "vitest";
import fc from "fast-check";
import catalog from "../src/data/mil-std-2525c-catalog.json";
import { convertSidc, convertSidc15To12, convertSidcToAll, validateSidc } from "../src";
import { STANDARD_IDENTITIES, STATUSES, SYMBOL_MODIFIERS, type CodingScheme } from "../src/legacy/fields";

const rows = (catalog as string[][]).map((r) => r[0]!).filter((t) => !/^[SGIOE]-/.test(t) && !t.includes("-*"));

/** Instantiates a 2525C table template with values drawn from the field tables. */
const concreteSidc = fc
  .record({
    template: fc.constantFrom(...rows),
    si: fc.constantFrom(...Object.keys(STANDARD_IDENTITIES)),
    pick: fc.nat(),
  })
  .map(({ template, si, pick }) => {
    const scheme = template[0] as CodingScheme;
    if (scheme === "W") return template;
    const statuses = Object.keys(STATUSES[scheme]);
    const mods = Object.keys(SYMBOL_MODIFIERS[scheme]);
    const c = [...template];
    if (c[1] === "*") c[1] = si;
    if (c[3] === "*") c[3] = statuses[pick % statuses.length]!;
    if (c[10] === "*" && c[11] === "*") {
      const m = mods[pick % mods.length]!;
      c[10] = m[0]!;
      c[11] = m[1]!;
    } else if (c[11] === "*") c[11] = "-";
    if (c[12] === "*") c[12] = "-";
    if (c[13] === "*") c[13] = "-";
    if (c[14] === "*") c[14] = "-";
    return c.join("");
  });

const TARGETS = ["MIL-STD-2525D", "APP-6D", "MIL-STD-2525E", "APP-6E"] as const;

describe("properties of numeric conversions", () => {
  it("success implies a 20-digit string with no placeholder text", () => {
    fc.assert(
      fc.property(concreteSidc, fc.constantFrom(...TARGETS), fc.boolean(), (sidc, target, allowLossy) => {
        const r = convertSidc(sidc, { targetStandard: target, allowLossy });
        if (r.success) {
          expect(r.output).toMatch(/^\d{20}$/);
          expect(r.errors).toEqual([]);
        } else {
          expect(r.output).toBeNull();
          expect(r.errors.length).toBeGreaterThan(0);
        }
        expect(JSON.stringify(r)).not.toMatch(/undefined|NaN/);
      }),
      { numRuns: 400 },
    );
  });

  it("strict mode never returns a lossy, ambiguous or unsupported success", () => {
    fc.assert(
      fc.property(concreteSidc, fc.constantFrom(...TARGETS), (sidc, target) => {
        const r = convertSidc(sidc, { targetStandard: target });
        if (r.success) expect(["exact", "equivalent"]).toContain(r.matchQuality);
      }),
      { numRuns: 400 },
    );
  });

  it("is deterministic", () => {
    fc.assert(
      fc.property(concreteSidc, (sidc) => {
        expect(convertSidcToAll(sidc, { allowLossy: true })).toEqual(convertSidcToAll(sidc, { allowLossy: true }));
      }),
      { numRuns: 100 },
    );
  });

  it("carries standard identity and status digits from the field tables", () => {
    fc.assert(
      fc.property(concreteSidc.filter((s) => s[0] === "S"), (sidc) => {
        const r = convertSidc(sidc, { allowLossy: true });
        if (!r.output) return;
        const si: Record<string, string> = { P: "00", U: "01", A: "02", F: "03", N: "04", S: "05", H: "06", G: "10", W: "11", M: "12", D: "13", L: "14", J: "15", K: "16" };
        const st: Record<string, string> = { P: "0", A: "1", C: "2", D: "3", X: "4", F: "5" };
        expect(r.output.slice(2, 4)).toBe(si[sidc[1]!]);
        expect(r.output[6]).toBe(st[sidc[3]!]);
      }),
      { numRuns: 300 },
    );
  });

  it("does not mutate option objects", () => {
    const options = Object.freeze({ affiliation: "F", symbolModifier: "--", allowLossy: true });
    expect(() => convertSidcToAll("S*GPUCI---*****", options)).not.toThrow();
  });
});

describe("properties of the 12-character form", () => {
  it("is the 12-character prefix of every valid input", () => {
    fc.assert(
      fc.property(concreteSidc, (sidc) => {
        const r = convertSidc15To12(sidc, { allowLossy: true });
        if (validateSidc(sidc).valid) {
          expect(r.output).toBe(sidc.slice(0, 12));
          expect(r.output).toHaveLength(12);
        }
      }),
      { numRuns: 300 },
    );
  });
});

describe("arbitrary strings", () => {
  it("never throw and never succeed unless they validate", () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.string({ minLength: 15, maxLength: 15 }), fc.anything()), (input) => {
        const v = validateSidc(input);
        const r = convertSidc(input, { allowLossy: true });
        if (!v.valid) expect(r.success).toBe(false);
      }),
      { numRuns: 500 },
    );
  });
});
