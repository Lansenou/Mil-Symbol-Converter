/**
 * Fuzz tests for the readers added after tests/property.test.ts (MSDL, DIS, CoT, readSidc, and
 * toRenderableSidc): random input must never crash them or make them slow, and their results must
 * keep their promises. Fixed seed, so a failure reproduces.
 */
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  ALL_TARGETS,
  convertNumericTo2525C,
  convertSidc,
  cotToSidc,
  disToSidc,
  readMsdl,
  readSidc,
  sidcToCot,
  sidcToDis,
  toRenderableSidc,
  validateSidc,
} from "../src";

const runs = { numRuns: 300, seed: 20261117 };
const SIDC_CHARS = "SGWIOEFHNUPAJKDLMXZ*-0123456789 —–abcfghnpu".split("");
/** 15-ish character strings from the characters a SIDC is made of, with typos. */
const sidcLike = fc
  .array(fc.constantFrom(...SIDC_CHARS), { minLength: 12, maxLength: 17 })
  .map((a) => a.join(""));
const anything = fc.oneof(
  fc.string(),
  fc.string({ unit: "grapheme", maxLength: 40 }),
  sidcLike,
  fc.anything(),
);

describe("fuzz: nothing throws", () => {
  it("on any value", () => {
    fc.assert(
      fc.property(anything, (x) => {
        validateSidc(x);
        toRenderableSidc(x);
        convertNumericTo2525C(x);
        readSidc(x);
        sidcToDis(x);
        disToSidc(x);
        disToSidc(x, { aggregate: true });
        sidcToCot(x);
        cotToSidc(x);
        for (const t of ALL_TARGETS) convertSidc(x, { targetStandard: t });
        convertSidc(x, { fuzzy: true });
      }),
      runs,
    );
  });

  it("on DIS- and CoT-shaped strings", () => {
    const dis = fc
      .array(fc.integer({ min: 0, max: 70000 }), { minLength: 1, maxLength: 8 })
      .map((a) => a.join("."));
    const cot = fc
      .tuple(
        fc.constantFrom(..."pfuahsnjkox.Z".split("")),
        fc.constantFrom(..."PAGSUFZ".split("")),
        fc.array(fc.constantFrom(..."ABCEGIMNPSUVWXZ019".split("")), {
          maxLength: 8,
        }),
      )
      .map(([a, d, f]) => ["a", a, d, ...f].join("-"));
    fc.assert(
      fc.property(fc.oneof(dis, cot), (x) => {
        readSidc(x);
        readSidc(x, { aggregate: true, forceId: 2 });
      }),
      runs,
    );
  });

  it("readMsdl fails only with an Error, on XML-ish noise", () => {
    const token = fc.constantFrom(
      "<",
      ">",
      "</",
      "/>",
      "<!--",
      "-->",
      "<![CDATA[",
      "]]>",
      "<?",
      "?>",
      "<!DOCTYPE",
      '"',
      "'",
      "=",
      "&amp;",
      "&#x110000;",
      "&#",
      "Unit",
      "ForceSide",
      "SymbolIdentifier",
      "S-G-UCI--------",
      " ",
    );
    fc.assert(
      fc.property(fc.array(token, { maxLength: 60 }), (parts) => {
        try {
          readMsdl(parts.join(""));
        } catch (e) {
          expect(e).toBeInstanceOf(Error);
          expect(e).not.toBeInstanceOf(TypeError);
          expect(e).not.toBeInstanceOf(RangeError);
        }
      }),
      runs,
    );
  });
});

describe("fuzz: results keep their promises", () => {
  it("toRenderableSidc gives null or a valid code without *", () => {
    fc.assert(
      fc.property(sidcLike, (x) => {
        const r = toRenderableSidc(x);
        if (r.output === null) return;
        expect(r.output).not.toContain("*");
        expect(validateSidc(r.output).valid).toBe(true);
      }),
      runs,
    );
  });

  it("readSidc output, when there is one, is a valid 2525C code", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          sidcLike,
          fc.constant("1.1.225.1"),
          fc.constant("a-f-G-U-C-I"),
        ),
        (x) => {
          const r = readSidc(x);
          if (r.output) expect(validateSidc(r.output).valid).toBe(true);
        },
      ),
      runs,
    );
  });
});

describe("fuzz: long input stays fast", () => {
  it("every reader handles 100 000 characters in well under a second", () => {
    const inputs = [
      "<".repeat(100_000),
      "<!--".repeat(25_000),
      "S".repeat(100_000),
      "1.".repeat(50_000),
      "a-f-G" + "-U".repeat(50_000),
      "*".repeat(100_000),
    ];
    for (const x of inputs) {
      const t = performance.now();
      try {
        readMsdl(x);
      } catch {
        // invalid XML is fine; slow is not
      }
      readSidc(x);
      toRenderableSidc(x);
      convertSidc(x, { fuzzy: true });
      expect(performance.now() - t, x.slice(0, 10)).toBeLessThan(1000);
    }
  });
});
