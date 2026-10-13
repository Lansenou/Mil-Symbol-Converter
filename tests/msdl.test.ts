import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { convertSidc, readMsdl, toRenderableSidc } from "../src";

const xml = readFileSync(
  new URL("./fixtures/sample.msdl.xml", import.meta.url),
  "utf8",
);
const byName = (s: ReturnType<typeof readMsdl>, name: string) =>
  s.symbols.find((x) => x.name === name)!;

describe("readMsdl", () => {
  it("reads force sides with their relationships", () => {
    const s = readMsdl(xml);
    expect(s.forceSides.map((f) => f.name)).toEqual([
      "Blue",
      "1st Blue Force",
      "Red & Allies",
      "Green",
    ]);
    expect(s.forceSides[0]!.relationships).toEqual({
      "side-red": "HO",
      "side-green": "NEUTRL",
    });
  });

  it("resolves affiliation from the viewpoint, status and echelon", () => {
    const s = readMsdl(xml, { viewpoint: "Blue" });
    expect(byName(s, "1-1 Infantry").sidc).toBe("SFGPUCI----F---");
    // Through the command chain: company -> battalion -> 1st Blue Force -> Blue.
    expect(byName(s, "A Company")).toMatchObject({
      sidc: "SFGPUCR----E---",
      forceSideHandle: "force-blue-1",
    });
    expect(byName(s, "Red Armor").sidc).toBe("SHGPUCA--------");
    expect(byName(s, "Green Police").sidc).toBe("SNGPUUM--------");
    expect(byName(s, "Tank 1")).toMatchObject({
      kind: "equipment",
      sidc: "SHGPEVAT-------",
    });
    expect(byName(s, "Field Hospital").sidc).toBe("SNGPIXH---H----");
  });

  it("depends on the point of view", () => {
    const red = readMsdl(xml, { viewpoint: "side-red" });
    expect(byName(red, "1-1 Infantry").sidc[1]).toBe("H");
    expect(byName(red, "Red Armor").sidc[1]).toBe("F");
    // Red has no association with Green: unknown, left as "*".
    expect(byName(red, "Green Police").sidc[1]).toBe("*");
  });

  it("leaves affiliation as * without a viewpoint, ready for toRenderableSidc", () => {
    const s = readMsdl(xml);
    const inf = byName(s, "1-1 Infantry");
    expect(inf.sidc).toBe("S*GPUCI----F---");
    expect(inf.notes.join()).toMatch(/viewpoint/);
    expect(
      toRenderableSidc(inf.sidc, { fallback: { affiliation: "Friend" } }).sidc,
    ).toBe("SFGPUCI----F---");
  });

  it("gives codes that convert", () => {
    const s = readMsdl(xml, { viewpoint: "Blue" });
    expect(convertSidc(byName(s, "1-1 Infantry").sidc).output).toBe(
      "10031000161211000000",
    );
  });

  it("stays fast on hostile input (linear scanner)", () => {
    for (const s of [
      "<".repeat(200_000),
      "<!--".repeat(50_000),
      '<a b="' + "x".repeat(200_000),
      "<a>".repeat(20_000) + "</a>".repeat(20_000),
      "&#99999999999;",
    ]) {
      const t = performance.now();
      try {
        readMsdl(s);
      } catch {
        // malformed input is expected to throw
      }
      expect(performance.now() - t).toBeLessThan(2000);
    }
  });

  it("rejects unknown viewpoints and malformed XML", () => {
    expect(() => readMsdl(xml, { viewpoint: "Purple" })).toThrow(/Purple/);
    expect(() => readMsdl("<a><b></a>")).toThrow(/MSDL/);
  });
});
