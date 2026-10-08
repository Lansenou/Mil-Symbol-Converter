import { describe, expect, it } from "vitest";
import fc from "fast-check";
import catalog from "../src/data/mil-std-2525c-catalog.json";
import { convertNumericTo2525C, convertSidc, validateSidc } from "../src";
import {
  STANDARD_IDENTITIES,
  SYMBOL_MODIFIERS,
  type CodingScheme,
} from "../src/legacy/fields";
import { fixtures } from "./fixtures";

const codes = (r: { diagnostics: { code: string }[] }) =>
  r.diagnostics.map((x) => x.code);

describe("numeric -> 2525C against hand-verified fixtures", () => {
  // The fixtures were checked against the 2525C and 2525D tables; read backwards, each 2525D code
  // must give back its 2525C source, unless the forward mapping merged it into a broader symbol.
  const exact = fixtures.filter(
    (f) =>
      f.targetStandard === "MIL-STD-2525D" &&
      f.matchQuality === "exact" &&
      f.target &&
      !f.source.includes("*"),
  );
  it.each(exact.map((f) => [f.target!, f.source, f] as const))(
    "%s -> %s",
    (numeric, source, f) => {
      const r = convertNumericTo2525C(
        numeric,
        f.options?.preferredSource
          ? { preferredSource: f.options.preferredSource }
          : {},
      );
      expect(r.errors).toEqual([]);
      expect(r.output).toBe(source);
      expect(r.matchQuality).toBe("exact");
      expect(r.targetStandard).toBe("MIL-STD-2525C");
    },
  );

  it("a merged code reads back as the general 2525C symbol, not the specialisation", () => {
    // ANTIARMOR DISMOUNTED and ANTIARMOR both convert to 120400; the code says only "antiarmor".
    const r = convertNumericTo2525C("10031000001204000000");
    expect(r.output).toBe("SFGPUCAA-------");
    expect(codes(r)).toContain("MORE_SPECIFIC_ALTERNATIVES");
  });
});

describe("numeric -> 2525C behaviour", () => {
  it("reads other editions and the 30-digit form", () => {
    expect(convertNumericTo2525C("15031000151211000002").output).toBe(
      "SFGPUCIC---E---",
    );
    expect(convertNumericTo2525C("15031000151211000002").matchQuality).toBe(
      "equivalent",
    );
    expect(convertNumericTo2525C("150301000011020006001000000000").output).toBe(
      "SFAPMHA--------",
    );
  });

  it("version 10 is read as 2525D unless APP-6D is stated", () => {
    expect(codes(convertNumericTo2525C("10031000001211000000"))).toContain(
      "VERSION_10_AS_2525D",
    );
    const a = convertNumericTo2525C("10031000001211000000", {
      sourceStandard: "APP-6D",
    });
    expect([a.output, a.matchQuality, a.sourceStandard]).toEqual([
      "SFGPUCI--------",
      "equivalent",
      "APP-6D",
    ]);
  });

  it("disputed codes need preferredSource", () => {
    const r = convertNumericTo2525C("10031000001206007400");
    expect([r.output, r.matchQuality]).toEqual([null, "ambiguous"]);
    expect(codes(r)).toContain("SOURCES_DISAGREE");
    expect(
      convertNumericTo2525C("10031000001206007400", {
        preferredSource: "JMSML",
      }).output,
    ).toBe("SFGPUCVRW------");
  });

  it("puts country code and order of battle only when given", () => {
    expect(
      convertNumericTo2525C("10031000151211000002", {
        countryCode: "US",
        orderOfBattle: "G",
      }).output,
    ).toBe("SFGPUCIC---EUSG");
    expect(convertNumericTo2525C("10032500003412000000").output).toBe(
      "GFTPA---------X",
    );
  });

  it.each([
    [Number("10031000151211000002"), "INVALID_TYPE"],
    ["1003100015121100000", "INVALID_NUMERIC_SIDC"],
    ["1003100015121100000A", "INVALID_NUMERIC_SIDC"],
    ["20031000001211000000", "UNSUPPORTED_VERSION"],
    ["13031000001211000000", "UNSUPPORTED_VERSION"],
    ["10231000001211000000", "UNMAPPED_STANDARD_IDENTITY"],
    ["10031000009999990000", "NO_MAPPING"],
    ["100310000012110000000010000000", "UNSUPPORTED_EXTENSION"],
  ] as const)("rejects %s (%s)", (input, code) => {
    const r = convertNumericTo2525C(input as unknown as string);
    expect(r.success).toBe(false);
    expect(r.output).toBeNull();
    expect(codes(r)).toContain(code);
  });

  it("rejects a version that contradicts sourceStandard", () => {
    expect(
      codes(
        convertNumericTo2525C("15031000001211000000", {
          sourceStandard: "MIL-STD-2525D",
        }),
      ),
    ).toContain("VERSION_MISMATCH");
  });

  it("is reachable through convertSidc", () => {
    const r = convertSidc("10031000151211000002", {
      sourceStandard: "MIL-STD-2525D",
      targetStandard: "MIL-STD-2525C",
    });
    expect(r.output).toBe("SFGPUCIC---E---");
    expect(
      convertSidc("10031000151211000002", { sourceStandard: "MIL-STD-2525D" })
        .success,
    ).toBe(false);
  });
});

describe("round trip 2525C -> numeric -> 2525C", () => {
  const symbols = [
    ...new Set(
      (catalog as string[][])
        .map(([t = ""]) => t)
        .filter((t) => t[0] !== "W" && !/^.-/.test(t)),
    ),
  ];
  const instance = fc
    .record({
      t: fc.constantFrom(...symbols),
      si: fc.constantFrom(...Object.keys(STANDARD_IDENTITIES)),
      pick: fc.nat(),
    })
    .map(({ t, si, pick }) => {
      const scheme = t[0] as Exclude<CodingScheme, "W">;
      const mods = Object.keys(SYMBOL_MODIFIERS[scheme]).filter(
        (m) => (t[10] === "H") === (m[0] === "H"),
      );
      const m = mods[pick % mods.length] ?? "--";
      const c = [...t];
      c[1] = si;
      if (c[3] === "*") c[3] = pick % 2 ? "P" : "A";
      if (c[10] === "*" || c[10] === "H") c[10] = m[0]!;
      if (c[11] === "*" || c[11] === "-") c[11] = m[1]!;
      for (const i of [12, 13, 14]) if (c[i] === "*") c[i] = "-";
      if (scheme === "G") c[14] = "X"; // Table B-I: tactical graphics carry X in position 15
      return c.join("");
    })
    .filter((s) => validateSidc(s).valid);

  it.each(["MIL-STD-2525D", "MIL-STD-2525E"] as const)(
    "exact/equivalent %s conversions come back unchanged",
    (target) => {
      fc.assert(
        fc.property(instance, (s) => {
          const f = convertSidc(s, {
            targetStandard: target,
            extendedSidc: true,
          });
          if (!f.success || !f.output) return;
          const r = convertNumericTo2525C(f.output);
          if (r.output !== s) {
            // Only allowed for symbols the 2525C tables list twice (same description).
            expect(r.diagnostics.map((x) => x.code)).toContain(
              "LISTED_TWICE_IN_2525C",
            );
            expect(`${r.output?.slice(0, 4)}${r.output?.slice(10)}`).toBe(
              `${s.slice(0, 4)}${s.slice(10)}`,
            );
          }
        }),
        { numRuns: 400 },
      );
    },
    30_000,
  );
});
