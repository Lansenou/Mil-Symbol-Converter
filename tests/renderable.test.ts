import { describe, expect, it } from "vitest";
import { toRenderableSidc, validateSidc } from "../src";

describe("toRenderableSidc", () => {
  it("fills wildcards with neutral defaults and keeps every given field", () => {
    const r = toRenderableSidc("S*G*UCMT--*****");
    expect(r.output).toBe("SUGPUCMT-------");
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
    expect(r.output).toBe("SHGPUCI--------");
    expect(r.filled[0]).toMatchObject({ value: "H", from: "fallback" });
  });

  it("keeps given characters of a partly wildcarded field", () => {
    const r = toRenderableSidc("SFGPUCI---A*---", {
      fallback: { symbolModifier: "-E" },
    });
    expect(r.output).toBe("SFGPUCI---AE---");
  });

  it("uses the default when a fallback does not fit the code", () => {
    // FullyCapable exists for warfighting symbols, not tactical graphics.
    const r = toRenderableSidc("GFG*GLB----****", {
      fallback: { status: "FullyCapable" },
    });
    expect(r.output).toBe("GFGPGLB-------X");
    expect(r.diagnostics.map((d) => d.code)).toContain("OPTION_IGNORED");
  });

  it("repairs pasted dashes", () => {
    expect(
      toRenderableSidc("SPG*UCMT—*****", { fallback: { status: "P" } }).output,
    ).toBe("SPGPUCMT-------");
  });

  it("draws an unlisted function ID as its nearest listed parent", () => {
    const r = toRenderableSidc("SFGPUCIZE------");
    expect(r.output).toBe("SFGPUCIZ-------");
    expect(r.matchQuality).toBe("lossy");
    expect(r.lost[0]).toContain("UCIZE-");
  });

  it("converts to numeric dropping only what the target cannot carry", () => {
    const r = toRenderableSidc("S*G*UCMT--*****", {
      targetStandard: "MIL-STD-2525D",
      fallback: { affiliation: "Friend", status: "FullyCapable" },
    });
    expect(r.output).toBe("10031020001307000046");
    expect(r.source2525C).toBe("SFGCUCMT-------");
  });

  it("returns null for input that is not a SIDC", () => {
    expect(toRenderableSidc("hello").output).toBeNull();
    expect(toRenderableSidc(42).output).toBeNull();
  });
});

describe("MIL-STD-2525B codes", () => {
  it("names the 2525B Change 2 symbols that 2525C retired", () => {
    const v = validateSidc("SFSPSP---------");
    expect(v.valid).toBe(false);
    expect(v.diagnostics[0]!.message).toMatch(/2525B Change 2.*Picket/);
    const r = toRenderableSidc("SFSPSP---------");
    expect(r.output).toBe("SFSP-----------");
    expect(r.lost[0]).toMatch(
      /2525B Change 2 symbol \(Military Combatant : Station : Picket\)/,
    );
  });
});
