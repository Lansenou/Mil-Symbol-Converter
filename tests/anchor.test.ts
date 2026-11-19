import ms from "milsymbol";
import { describe, expect, it } from "vitest";
import { symbolAnchor } from "../src/element";

const at = (sidc: string, options: Record<string, unknown> = {}) => {
  const s = new ms.Symbol(sidc, { size: 50, ...options });
  return { own: s.getAnchor(), ours: symbolAnchor(s, sidc), svg: s.asSVG() };
};

describe("symbolAnchor", () => {
  it("is the free end of the direction staff for moving ground symbols", () => {
    // The staff runs from the frame bottom (y 150 of 0-200) one frame height down (100 units).
    const unit = at("SFGPUCI----E---", { direction: 45 });
    expect(unit.svg).toContain("M 100,150l0,100");
    expect(unit.ours).toEqual({ x: 39.5, y: 122 });
    expect(unit.own).toEqual({ x: 39.5, y: 47 }); // milsymbol: frame center
    // Hostile diamond: lower frame bottom, same rule.
    expect(at("SHGPEVAT-------", { direction: 270 }).ours).toEqual({
      x: 49.5,
      y: 124,
    });
    // Numeric land codes too.
    expect(at("10031000151211000000", { direction: 45 }).ours).toEqual({
      x: 39.5,
      y: 122,
    });
  });

  it("keeps milsymbol's anchor everywhere else", () => {
    for (const [sidc, options] of [
      ["SFGPUCI----E---", {}], // no arrow
      ["SFGPUCI---A----", { direction: 45 }], // headquarters staff: milsymbol is right
      ["SFAPMFF--------", { direction: 90 }], // air: the arrow starts at the center
      ["SFSPCLFF-------", { direction: 90 }], // sea
      ["SFGPUCI--------", { direction: "" }], // no direction given
    ] as const) {
      const r = at(sidc, options);
      expect(r.ours, sidc).toEqual(r.own);
    }
  });

  it("falls back to getAnchor when the geometry is not there", () => {
    const fake = {
      getAnchor: () => ({ x: 1, y: 2 }),
      options: { direction: 45 },
    };
    expect(symbolAnchor(fake, "SFGPUCI--------")).toEqual({ x: 1, y: 2 });
  });
});
