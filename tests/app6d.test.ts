import { describe, expect, it } from "vitest";
import {
  convertSidc15To2525D,
  convertSidc15To2525E,
  convertSidc15ToApp6D,
  convertSidc15ToApp6E,
  convertSidc,
} from "../src";
import { failures, fixtures } from "./fixtures";

const edition = fixtures.filter((f) =>
  ["APP-6D", "MIL-STD-2525E", "APP-6E"].includes(f.targetStandard),
);

describe("APP-6 and 2525E targets (dataset-verified fixtures)", () => {
  it.each(edition.map((f) => [f.source, f.targetStandard, f.target] as const))(
    "%s -> %s %s",
    (source, target, expected) => {
      const r = convertSidc(source, { targetStandard: target });
      expect(r.output).toBe(expected);
      // Never exact: no mapping table written for these editions was available.
      expect(r.matchQuality).toBe("equivalent");
    },
  );

  it.each(
    failures
      .filter((f) => f.targetStandard !== "MIL-STD-2525D")
      .map(
        (f) => [f.source, f.targetStandard, f.expectedErrorCode, f] as const,
      ),
  )("%s -> %s fails with %s", (source, target, code, f) => {
    const r = convertSidc(source, { targetStandard: target, ...f.options });
    expect(r.success).toBe(false);
    expect(r.matchQuality).toBe(f.matchQuality);
    expect(r.diagnostics.map((x) => x.code)).toContain(code);
  });
});

describe("APP-6D is not assumed to equal 2525D", () => {
  it("uses the same digits only where both catalogs name the code the same", () => {
    const d = convertSidc15To2525D("SHAPMFB--------");
    const a = convertSidc15ToApp6D("SHAPMFB--------");
    expect(a.output).toBe(d.output);
    expect(d.matchQuality).toBe("exact");
    expect(a.matchQuality).toBe("equivalent");
  });

  it("reports codes valid in 2525D but absent from APP-6D (SIGINT symbol sets)", () => {
    expect(convertSidc15To2525D("IHAPSRE--------").success).toBe(true);
    const r = convertSidc15ToApp6D("IHAPSRE--------");
    expect(r.success).toBe(false);
    expect(r.matchQuality).toBe("unsupported");
  });

  it("refuses codes whose APP-6D meaning is disputed", () => {
    const r = convertSidc15ToApp6D("SFGPUCVRW------", {
      preferredSource: "mil-sym-ts",
    });
    expect(r.success).toBe(false);
    expect(r.diagnostics.map((x) => x.code)).toContain("CONTESTED_CODE");
  });

  it("APP-6(C) output is unsupported with an explanation", () => {
    const r = convertSidc("SFGPUCI--------", { targetStandard: "APP-6C" });
    expect(r.matchQuality).toBe("unsupported");
    expect(r.errors[0]).toMatch(/APP-6\(C\)/);
  });

  it("2525E output carries version 15 and APP-6E version 16", () => {
    expect(convertSidc15To2525E("SHGPUCI--------").output?.slice(0, 2)).toBe(
      "15",
    );
    expect(convertSidc15ToApp6E("SHGPUCI--------").output?.slice(0, 2)).toBe(
      "16",
    );
  });
});
