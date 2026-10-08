import { describe, expect, it } from "vitest";
import { convertSidc, convertSidc15To12, resolveWildcards, wildcardFields } from "../src";

const TEMPLATE = "S*GPUCI---*****";
const codes = (r: { diagnostics: { code: string }[] }) => r.diagnostics.map((d) => d.code);

describe("resolveWildcards", () => {
  it("lists the wildcard fields of a template", () => {
    expect(wildcardFields(TEMPLATE).map((f) => f.field)).toEqual([
      "standardIdentity",
      "symbolModifier",
      "countryCode",
      "orderOfBattle",
    ]);
  });

  it("substitutes only explicitly supplied values", () => {
    const r = resolveWildcards(TEMPLATE, { affiliation: "H" });
    expect(r.sidc).toBe("SHGPUCI---*****");
    expect(r.resolved).toEqual([{ field: "standardIdentity", positions: [2], value: "H" }]);
    expect(r.unresolved.map((u) => u.field)).toEqual(["symbolModifier", "countryCode", "orderOfBattle"]);
  });

  it("never replaces * by - or 0 on its own", () => {
    const r = resolveWildcards(TEMPLATE, {});
    expect(r.sidc).toBe(TEMPLATE);
  });

  it("does not override concrete input characters", () => {
    const r = resolveWildcards("SFGPUCI--------", { affiliation: "H" });
    expect(r.sidc).toBe("SFGPUCI--------");
    expect(codes(r)).toContain("OPTION_IGNORED");
  });

  it("rejects values of the wrong length or containing *", () => {
    expect(codes(resolveWildcards(TEMPLATE, { symbolModifier: "-" }))).toContain("INVALID_RESOLUTION_VALUE");
    expect(codes(resolveWildcards(TEMPLATE, { affiliation: "*" }))).toContain("INVALID_RESOLUTION_VALUE");
  });

  it("rejects a value that conflicts with a partially specified field", () => {
    const r = resolveWildcards("SFGPUCI----*---", { symbolModifier: "AE" });
    expect(codes(r)).toContain("INVALID_RESOLUTION_VALUE");
  });
});

describe("wildcards in conversions", () => {
  it("S*GPUCI---***** has no unique numeric counterpart", () => {
    const r = convertSidc(TEMPLATE);
    expect(r.success).toBe(false);
    expect(r.output).toBeNull();
    expect(r.matchQuality).toBe("ambiguous");
    expect(r.ambiguousPositions).toEqual([2, 11, 12]);
  });

  it("resolves affiliation and symbol modifier from options", () => {
    const r = convertSidc(TEMPLATE, { affiliation: "F", symbolModifier: "--" });
    expect(r.success).toBe(true);
    expect(r.output).toBe("10031000001211000000");
    expect(r.normalizedInput).toBe("SFGPUCI-----***");
    expect(codes(r)).toContain("WILDCARD_NOT_CARRIED");
  });

  it("resolves multiple wildcards including echelon and status", () => {
    const r = convertSidc("S*G*UCI---*****", { affiliation: "H", status: "A", symbolModifier: "-E" });
    expect(r.output).toBe("10061010151211000000");
  });

  it("fails when only some required wildcards are resolved, naming the positions", () => {
    const r = convertSidc(TEMPLATE, { affiliation: "F" });
    expect(r.success).toBe(false);
    expect(r.ambiguousPositions).toEqual([11, 12]);
    expect(r.errors[0]).toMatch(/symbolModifier/);
  });

  it("rejects an invalid resolution value", () => {
    const r = convertSidc(TEMPLATE, { affiliation: "X", symbolModifier: "--" });
    expect(r.success).toBe(false);
    expect(codes(r)).toContain("INVALID_RESOLUTION_VALUE");
  });

  it("rejects a resolution that makes an invalid combination", () => {
    // H (installation) is not valid for an infantry unit.
    const r = convertSidc(TEMPLATE, { affiliation: "F", symbolModifier: "H-" });
    expect(r.success).toBe(false);
  });

  it("wildcardPolicy reject refuses templates", () => {
    const r = convertSidc(TEMPLATE, { wildcardPolicy: "reject", affiliation: "F", symbolModifier: "--" });
    expect(codes(r)).toContain("WILDCARD_REJECTED");
  });

  it("wildcardPolicy preserve keeps * and therefore cannot produce a numeric code", () => {
    const r = convertSidc(TEMPLATE, { wildcardPolicy: "preserve", affiliation: "F", symbolModifier: "--" });
    expect(r.success).toBe(false);
    expect(codes(r)).toContain("UNRESOLVED_WILDCARD");
  });

  it("wildcardPolicy preserve keeps * in the 12-character form", () => {
    const r = convertSidc15To12(TEMPLATE, { wildcardPolicy: "preserve" });
    expect(r.output).toBe("S*GPUCI---**");
  });

  it("resolve + 12-character form substitutes supplied values and keeps the rest", () => {
    const r = convertSidc15To12(TEMPLATE, { affiliation: "N" });
    expect(r.output).toBe("SNGPUCI---**");
    expect(codes(r)).toContain("TEMPLATE_OUTPUT");
  });

  it("METOC codes never accept wildcards", () => {
    expect(convertSidc("WAS-PL----P---*").success).toBe(false);
  });
});
