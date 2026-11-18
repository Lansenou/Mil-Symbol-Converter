import { afterEach, describe, expect, it } from "vitest";
import { convertSidc, setCacheSize, toRenderableSidc } from "../src";

afterEach(() => setCacheSize(1000));

describe("results cache", () => {
  it("gives each caller its own copy", () => {
    const a = convertSidc("SFGPUCI----E---");
    a.warnings.push("changed by the caller");
    a.diagnostics.length = 0;
    const b = convertSidc("SFGPUCI----E---");
    expect(b.warnings).not.toContain("changed by the caller");
    expect(b).toEqual(convertSidc("SFGPUCI----E---"));
    expect(b).not.toBe(a);
  });

  it("keys on the options", () => {
    const d = convertSidc("SFGPUCI--------");
    const app6 = convertSidc("SFGPUCI--------", { targetStandard: "APP-6D" });
    expect(d.targetStandard).toBe("MIL-STD-2525D");
    expect(app6.targetStandard).toBe("APP-6D");
    expect(
      toRenderableSidc("S*GPUCI--------", { fallback: { affiliation: "H" } })
        .output,
    ).toBe("SHGPUCI--------");
    expect(toRenderableSidc("S*GPUCI--------").output).toBe("SUGPUCI--------");
  });

  it("gives the same results with the cache off", () => {
    const codes = ["SFGPUCIC---E---", "SHAPMFB--------", "S*G*UCI---*****"];
    const on = codes.map((c) => [convertSidc(c), toRenderableSidc(c)]);
    setCacheSize(0);
    expect(codes.map((c) => [convertSidc(c), toRenderableSidc(c)])).toEqual(on);
  });

  it("skips options it cannot key safely", () => {
    const options = { targetStandard: "APP-6D" as const, extra: () => 1 };
    expect(convertSidc("SFGPUCI--------", options).targetStandard).toBe(
      "APP-6D",
    );
  });
});
