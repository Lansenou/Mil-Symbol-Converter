import { describe, expect, it } from "vitest";
import { convertSidc15To2525D, type Mil2525dVersion } from "../src";
import { failures, fixtures } from "./fixtures";

const d = fixtures.filter((f) => f.targetStandard === "MIL-STD-2525D");

describe("MIL-STD-2525C -> MIL-STD-2525D (verified fixtures)", () => {
  it("has fixtures across symbol families", () => {
    const sets = new Set(d.map((f) => f.target!.slice(4, 6)));
    for (const ss of [
      "01",
      "02",
      "05",
      "10",
      "11",
      "15",
      "20",
      "25",
      "30",
      "35",
      "36",
      "40",
      "45",
      "51",
    ]) {
      expect(sets, `symbol set ${ss}`).toContain(ss);
    }
  });

  it.each(d.map((f) => [f.source, f.target, f.matchQuality, f] as const))(
    "%s -> %s (%s)",
    (source, target, quality, f) => {
      const r = convertSidc15To2525D(source, f.options);
      expect(r.errors).toEqual([]);
      expect(r.success).toBe(true);
      expect(r.output).toBe(target);
      expect(r.matchQuality).toBe(quality);
      expect(r.targetStandard).toBe("MIL-STD-2525D");
    },
  );
});

describe("MIL-STD-2525D expected failures", () => {
  it.each(
    failures
      .filter((f) => f.targetStandard === "MIL-STD-2525D")
      .map((f) => [f.source, f.expectedErrorCode, f] as const),
  )("%s fails with %s", (source, code, f) => {
    const r = convertSidc15To2525D(source, f.options);
    expect(r.success).toBe(false);
    expect(r.output).toBeNull();
    expect(r.matchQuality).toBe(f.matchQuality);
    expect(r.diagnostics.map((x) => x.code)).toContain(code);
  });
});

describe("MIL-STD-2525D specifics", () => {
  it("friendly, hostile, neutral and unknown ground units differ only in digits 3-4", () => {
    const out = ["F", "H", "N", "U"].map(
      (a) => convertSidc15To2525D(`S${a}GPUCI--------`).output,
    );
    expect(out).toEqual([
      "10031000001211000000",
      "10061000001211000000",
      "10041000001211000000",
      "10011000001211000000",
    ]);
  });

  it("present vs planned status", () => {
    expect(convertSidc15To2525D("SFGPUCI--------").output?.[6]).toBe("0");
    expect(convertSidc15To2525D("SFGAUCI--------").output?.[6]).toBe("1");
  });

  it("tactical graphic status S (suspected) is merged into status 1 and reported lossy", () => {
    const strict = convertSidc15To2525D("GFTSA---------X");
    expect(strict.success).toBe(false);
    expect(strict.matchQuality).toBe("lossy");
    const ok = convertSidc15To2525D("GFTSA---------X", { allowLossy: true });
    expect(ok.output).toBe("10032510003412000000");
  });

  it("tactical graphic status K (known) has no documented numeric value", () => {
    const r = convertSidc15To2525D("GFTKA---------X");
    expect(r.success).toBe(false);
    expect(r.diagnostics.map((x) => x.code)).toContain("UNMAPPED_STATUS");
  });

  it("feint/dummy installation HB sets HQ/TF/dummy digit 1", () => {
    expect(convertSidc15To2525D("SFGPIXH---HB---").output).toBe(
      "10032001001207020000",
    );
  });

  it("supports version 11 (2525D Change 1) where the Change 1 table applies", () => {
    const r = convertSidc15To2525D("SFGPUCIC---E---", {
      mil2525dVersion: "11",
    });
    expect(r.output).toBe("11031000151211000002");
    expect(r.matchQuality).toBe("exact");
  });

  it("uses the Change 1 table where 2525D and Change 1 differ (air assault infantry)", () => {
    const v10 = convertSidc15To2525D("SFGPUCIS-------");
    const v11 = convertSidc15To2525D("SFGPUCIS-------", {
      mil2525dVersion: "11",
    });
    expect(v10.output).toBe("10031000001211000100"); // sector 1 modifier 01 Air Assault (2525D)
    expect(v11.output).toBe("11031000001211000059"); // sector 2 modifier 59 (2525D Change 1)
  });

  it("rejects an unknown version", () => {
    expect(
      convertSidc15To2525D("SFGPUCI--------", {
        mil2525dVersion: "12" as Mil2525dVersion,
      }).success,
    ).toBe(false);
  });

  it("keeps numeric SIDCs as strings with leading zeros", () => {
    const r = convertSidc15To2525D("SPGPUCI--------");
    expect(typeof r.output).toBe("string");
    expect(r.output).toBe("10001000001211000000");
  });

  it("reports single-source mappings", () => {
    const r = convertSidc15To2525D("SFGPUCIS-------");
    expect(r.confidence).toBe("single-source");
    expect(r.diagnostics.map((x) => x.code)).toContain("SINGLE_SOURCE");
  });

  it("metadata describes the symbol", () => {
    const r = convertSidc15To2525D("SFGPUCIC---E---");
    expect(r.metadata).toMatchObject({
      symbolSet: "10",
      symbolSetName: "Land Unit",
      entityCode: "121100",
      entity: "Movement and Maneuver : Infantry",
      affiliation: "Friend",
      status: "Present",
      legacyDescription: "INFANTRY ARCTIC",
    });
    expect(r.metadata?.modifiers).toEqual(["Arctic"]);
  });
});
