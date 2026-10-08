import { describe, expect, it } from "vitest";
import {
  ALL_TARGETS,
  analyzeSidc,
  convertSidc,
  convertSidcToAll,
  convertToNumeric,
  NUMERIC_TARGETS,
  type MappingAdapter,
} from "../src";

describe("convertSidc dispatch", () => {
  it("defaults to MIL-STD-2525D", () => {
    expect(convertSidc("SFGPUCIC---E---").targetStandard).toBe("MIL-STD-2525D");
  });
  it("identity target validates and normalizes", () => {
    const r = convertSidc("sfgpucic---e---", {
      targetStandard: "MIL-STD-2525C",
    });
    expect(r.output).toBe("SFGPUCIC---E---");
  });
  it("rejects an unknown target and a non-2525C source", () => {
    // @ts-expect-error runtime check
    expect(
      convertSidc("SFGPUCI--------", { targetStandard: "MIL-STD-2525F" })
        .success,
    ).toBe(false);
    expect(
      convertSidc("SFGPUCI--------", { sourceStandard: "MIL-STD-2525D" })
        .success,
    ).toBe(false);
  });
});

describe("convertSidcToAll", () => {
  it("returns one independent result per target", () => {
    const all = convertSidcToAll("SFGPUCIC---E---");
    expect(Object.keys(all)).toEqual([...ALL_TARGETS]);
    expect(all["LEGACY-12"]?.output).toBe("SFGPUCIC---E");
    expect(all["MIL-STD-2525D"]?.output).toBe("10031000151211000002");
    expect(all["APP-6C"]?.success).toBe(false);
  });
});

describe("analyzeSidc", () => {
  it("describes every field", () => {
    const a = analyzeSidc("SFGPUCIC---EUSG");
    expect(a.fields.map((f) => [f.name, f.meaning])).toEqual([
      ["coding scheme", "Warfighting (Appendix A)"],
      ["standard identity", "Friend"],
      ["battle dimension / category", "Ground"],
      ["status", "Present"],
      ["function ID", "INFANTRY ARCTIC"],
      ["symbol modifier", "Company/battery/troop"],
      ["country code", "ISO 3166-1 US"],
      ["order of battle", "Ground OB"],
    ]);
    expect(a.evidence.map((e) => e.source).sort()).toEqual([
      "JMSML",
      "mil-sym-ts",
    ]);
  });
  it("describes METOC fields", () => {
    expect(analyzeSidc("WAS-PL----P----").fields.map((f) => f.meaning)).toEqual(
      [
        "Meteorological and oceanographic (Appendix C)",
        "Atmospheric",
        "Static",
        "LOW PRESSURE CENTER",
        "Point",
        null,
      ],
    );
  });
  it("does not crash on invalid input", () => {
    expect(analyzeSidc(undefined).fields).toEqual([]);
  });
});

describe("mapping adapters are pluggable", () => {
  it("a single adapter yields single-source results", () => {
    const only: MappingAdapter[] = [
      {
        name: "JMSML",
        description: "test double",
        lookup: () => [
          {
            source: "JMSML",
            nativeEdition: "2525D",
            version: "10",
            template: "S*G*UCI---*****",
            retired: false,
            symbolSet: "10",
            entity: "121100",
            m1: "00",
            m2: "00",
            fanIn: 1,
            canonical: true,
          },
        ],
      },
    ];
    const r = convertToNumeric(
      "SFGPUCI--------",
      NUMERIC_TARGETS["2525D"],
      {},
      only,
    );
    expect(r.output).toBe("10031000001211000000");
    expect(r.confidence).toBe("single-source");
  });
  it("no adapters means no mapping", () => {
    const r = convertToNumeric(
      "SFGPUCI--------",
      NUMERIC_TARGETS["2525D"],
      {},
      [],
    );
    expect(r.matchQuality).toBe("unsupported");
  });
  it("an adapter cannot inject a code absent from the target catalog", () => {
    const bogus: MappingAdapter = {
      name: "mil-sym-ts",
      description: "bogus",
      lookup: () => [
        {
          source: "mil-sym-ts",
          nativeEdition: "2525Dch1",
          version: "11",
          template: "x",
          retired: false,
          symbolSet: "10",
          entity: "999999",
          m1: "00",
          m2: "00",
          fanIn: 1,
          canonical: true,
        },
      ],
    };
    expect(
      convertToNumeric("SFGPUCI--------", NUMERIC_TARGETS["2525D"], {}, [bogus])
        .success,
    ).toBe(false);
  });
});
