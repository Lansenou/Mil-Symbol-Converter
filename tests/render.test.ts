// Visual sanity check (not proof of equivalence): every code the converter produces must be
// drawable by milsymbol whenever milsymbol can draw the 2525C input. milsymbol's isValid() is true
// when it has an icon for the symbol; it only draws point symbols, so line/area tactical graphics
// are undrawable on both sides and are not checked.
import { describe, expect, it } from "vitest";
import ms from "milsymbol";
import catalog from "../src/data/mil-std-2525c-catalog.json";
import { convertSidc, validateSidc, type SidcStandard } from "../src";

/**
 * Known milsymbol gaps, checked in its source (src/numbersidc/sidc/*): it draws these only from
 * letter SIDCs. Each is a renderer limitation; the converter's mapping matches the target catalog
 * by name.
 */
const RENDERER_GAPS: { test: (numeric: string) => boolean; reason: string }[] =
  [
    {
      test: (n) => ["45", "46"].includes(n.slice(4, 6)),
      reason:
        "milsymbol has no numeric atmospheric/oceanographic (45/46) icons",
    },
    {
      test: (n) =>
        n.slice(4, 6) === "25" &&
        ["270705", "271100"].includes(n.slice(10, 16)),
      reason:
        "milsymbol has no numeric icon for Dummy Minefield (270705) or Bridge or Gap (271100)",
    },
  ];

const drawable = (sidc: string, standard: "2525" | "APP6") =>
  new ms.Symbol(sidc, { standard }).isValid() === true;

const symbols = [
  ...new Set(
    (catalog as string[][])
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
      .filter((s) => validateSidc(s).valid),
  ),
];
const drawableInputs = symbols.filter((s) => drawable(s, "2525"));

describe("milsymbol render check", () => {
  it("renders the regression pair on both sides", () => {
    expect(drawable("SFGPUCIC---E---", "2525")).toBe(true);
    expect(drawable("10031000151211000002", "2525")).toBe(true);
    // A code with no entity is reported undrawable, so the check can fail.
    expect(drawable("10031000009999990000", "2525")).toBe(false);
  });

  it("covers a meaningful share of the 2525C tables", () => {
    expect(drawableInputs.length).toBeGreaterThan(1000);
  });

  it.each([
    "MIL-STD-2525D",
    "APP-6D",
    "MIL-STD-2525E",
    "APP-6E",
  ] as SidcStandard[])(
    "every %s output is drawable when its 2525C input is",
    (target) => {
      const standard = target.startsWith("APP") ? "APP6" : "2525";
      const failures: string[] = [];
      let checked = 0;
      for (const s of drawableInputs) {
        // fuzzy + allowLossy + extendedSidc returns a superset of the strict outputs.
        const r = convertSidc(s, {
          targetStandard: target,
          allowLossy: true,
          extendedSidc: true,
          fuzzy: true,
        });
        if (!r.success || !r.output) continue;
        if (RENDERER_GAPS.some((g) => g.test(r.output!))) continue;
        checked++;
        if (!drawable(r.output, standard))
          failures.push(`${s} -> ${r.output} (${r.matchQuality})`);
      }
      expect(checked).toBeGreaterThan(500);
      expect(failures).toEqual([]);
    },
  );
});
