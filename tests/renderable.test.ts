import { describe, expect, it } from "vitest";
import { toRenderableSidc } from "../src";

describe("toRenderableSidc", () => {
  it("fills wildcards with neutral defaults and keeps every given field", () => {
    const r = toRenderableSidc("S*G*UCMT--*****");
    expect(r.sidc).toBe("SUGPUCMT-------");
    expect(r.matchQuality).toBe("exact");
    expect(r.filled.map((f) => [f.field, f.value, f.from])).toEqual([
      ["standardIdentity", "U", "default"],
      ["status", "P", "default"],
      ["symbolModifier", "--", "default"],
      ["countryCode", "--", "default"],
      ["orderOfBattle", "-", "default"],
    ]);
  });

  it("uses fallbacks only where the code has *", () => {
    const r = toRenderableSidc("S*GPUCI---*****", {
      fallback: { affiliation: "Hostile", status: "Anticipated" },
    });
    expect(r.sidc).toBe("SHGPUCI--------");
    expect(r.filled[0]).toMatchObject({ value: "H", from: "fallback" });
  });

  it("keeps given characters of a partly wildcarded field", () => {
    const r = toRenderableSidc("SFGPUCI---A*---", {
      fallback: { symbolModifier: "-E" },
    });
    expect(r.sidc).toBe("SFGPUCI---AE---");
  });

  it("uses the default when a fallback does not fit the code", () => {
    // FullyCapable exists for warfighting symbols, not tactical graphics.
    const r = toRenderableSidc("GFG*GLB----****", {
      fallback: { status: "FullyCapable" },
    });
    expect(r.sidc).toBe("GFGPGLB-------X");
    expect(r.diagnostics.map((d) => d.code)).toContain("OPTION_IGNORED");
  });

  it("repairs pasted dashes", () => {
    expect(
      toRenderableSidc("SPG*UCMT—*****", { fallback: { status: "P" } }).sidc,
    ).toBe("SPGPUCMT-------");
  });

  it("draws an unlisted function ID as its nearest listed parent", () => {
    const r = toRenderableSidc("SFGPUCIZE------");
    expect(r.sidc).toBe("SFGPUCIZ-------");
    expect(r.matchQuality).toBe("lossy");
    expect(r.dropped[0]).toContain("UCIZE-");
  });

  it("converts to numeric dropping only what the target cannot carry", () => {
    const r = toRenderableSidc("S*G*UCMT--*****", {
      targetStandard: "MIL-STD-2525D",
      fallback: { affiliation: "Friend", status: "FullyCapable" },
    });
    expect(r.sidc).toBe("10031020001307000046");
    expect(r.source2525C).toBe("SFGCUCMT-------");
  });

  it("returns null for input that is not a SIDC", () => {
    expect(toRenderableSidc("hello").sidc).toBeNull();
    expect(toRenderableSidc(42).sidc).toBeNull();
  });
});
