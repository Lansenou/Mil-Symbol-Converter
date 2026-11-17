import { describe, expect, it } from "vitest";
import {
  convertSidc,
  cotToSidc,
  detectInput,
  disToSidc,
  readSidc,
  sidcToCot,
  sidcToDis,
  toRenderableSidc,
} from "../src";

describe("detectInput", () => {
  it("tells the identifiers apart", () => {
    expect(detectInput("SFGPUCI--------")).toBe("2525C");
    expect(detectInput(" 10031000151211000000 ")).toBe("numeric");
    expect(detectInput("1.1.225.1.1.3")).toBe("dis");
    expect(detectInput("a-f-G-U-C-I")).toBe("cot");
    expect(detectInput("")).toBeNull();
    expect(detectInput(42)).toBeNull();
  });
});

describe("readSidc", () => {
  it("reads every kind as a 2525C code", () => {
    expect(readSidc("sfgpuci--------").output).toBe("SFGPUCI--------");
    expect(readSidc("10031000151211000000").output).toBe("SFGPUCI----E---");
    expect(readSidc("1.1.225.1", { forceId: 2 }).output).toBe(
      "SHGPEVAT----US-",
    );
    expect(readSidc("1.1.225.6.3", { aggregate: true }).output).toBe(
      "S*GPUCI----FUS-",
    );
    expect(readSidc("a-h-G-E-V-A-T").output).toBe("SHGPEVAT-------");
  });

  it("says what was lost and refuses non-strings", () => {
    const r = readSidc("1.1.225.1.1.3");
    expect(r.kind).toBe("dis");
    expect(r.matchQuality).toBe("lossy");
    expect(r.lost.length).toBeGreaterThan(0);
    expect(readSidc(null).output).toBeNull();
    expect(readSidc("nonsense").output).toBeNull();
  });
});

describe("every result has output and lost", () => {
  it("across the converters", () => {
    const results = [
      convertSidc("SFGPUCIC---EUS-", { allowLossy: true }),
      toRenderableSidc("S*G*UCI---*****"),
      sidcToDis("SFGPEVATH------"),
      disToSidc("1.1.225.1.1.3"),
      sidcToCot("SFGPUCI----E---"),
      cotToSidc("a-f-G-U-C-I-Q"),
    ];
    for (const r of results) {
      expect(r.output).toEqual(expect.any(String));
      expect(Array.isArray(r.lost)).toBe(true);
    }
    // A lossy result names what it lost.
    expect(results[0]!.lost.length).toBeGreaterThan(0);
    expect(results[2]!.lost.length).toBeGreaterThan(0);
    expect(results[4]!.lost.length).toBeGreaterThan(0);
    expect(results[5]!.lost.length).toBeGreaterThan(0);
  });
});
