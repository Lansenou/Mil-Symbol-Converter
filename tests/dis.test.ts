import { describe, expect, it } from "vitest";
import {
  affiliationToForceId,
  disToSidc,
  forceIdToAffiliation,
  sidcToDis,
  validateSidc,
} from "../src";
import dis from "../src/data/dis.json";

describe("sidcToDis", () => {
  it("fills kind, domain, country and category", () => {
    const r = sidcToDis("SHGPEVAT----RU-");
    expect(r.text).toBe("1.1.222.1.0.0.0");
    expect(r.forceId).toBe(2);
    expect(r.matchQuality).toBe("equivalent");
  });

  it("calls it lossy when the symbol says more than DIS can", () => {
    expect(sidcToDis("SFGPEVATH---US-").matchQuality).toBe("lossy");
    expect(sidcToDis("SFAPMFF----F---").matchQuality).toBe("lossy");
  });

  it("covers air, sea, subsurface, space and munitions", () => {
    expect(sidcToDis("SFAPMFF--------").text).toBe("1.2.0.1.0.0.0");
    expect(sidcToDis("SFSPCLFF----GB-").text).toBe("1.3.224.50.0.0.0");
    expect(sidcToDis("SFUPSNB--------").text).toBe("1.4.0.1.0.0.0");
    expect(sidcToDis("SFPPS----------").text).toBe("1.5.0.11.0.0.0");
    expect(sidcToDis("SFAPWMSA-------").text).toBe("2.1.0.1.0.0.0");
  });

  it("uses the mobility modifier to tell self-propelled from towed artillery", () => {
    expect(sidcToDis("SFGPEWH--------").entityType?.category).toBe(5);
    expect(sidcToDis("SFGPEWH---MO---").entityType?.category).toBe(4);
  });

  it("reads numeric codes and fills missing fields", () => {
    expect(sidcToDis("10031500001201000000").text).toBe("1.1.0.2.0.0.0");
    const open = sidcToDis("S*G*EVAT-------");
    expect(open.text).toBe("1.1.0.1.0.0.0");
    expect(open.forceId).toBeNull();
  });

  it("falls back to the domain when DIS has no category", () => {
    const r = sidcToDis("SFGPEWM--------");
    expect(r.text).toBe("1.1.0.0.0.0.0");
    expect(r.matchQuality).toBe("approximate");
  });

  it("refuses units and non-warfighting symbols", () => {
    expect(sidcToDis("SFGPUCI----E---").entityType).toBeNull();
    expect(sidcToDis("GFGPGPP-------X").entityType).toBeNull();
    expect(sidcToDis("nonsense").entityType).toBeNull();
  });
});

describe("disToSidc", () => {
  it("draws every model of a category as that category's symbol", () => {
    const r = disToSidc("1.1.225.1.1.3", { forceId: 2 });
    expect(r.sidc).toBe("SHGPEVAT----US-");
    expect(r.matchQuality).toBe("lossy");
  });

  it("takes objects and arrays; leaves affiliation open without a Force ID", () => {
    expect(
      disToSidc({
        kind: 1,
        domain: 3,
        country: 224,
        category: 50,
        subcategory: 0,
        specific: 0,
        extra: 0,
      }).sidc,
    ).toBe("S*SPCLFF----GB-");
    expect(disToSidc([1, 2, 222, 1]).sidc).toBe("S*APMFF-----RU-");
  });

  it("falls back to the domain frame for categories without a symbol", () => {
    const r = disToSidc("1.1.0.99");
    expect(r.sidc).toBe("S*GPE----------");
    expect(r.matchQuality).toBe("approximate");
  });

  it("refuses kinds it has no symbol for and bad input", () => {
    expect(disToSidc("3.1.225").sidc).toBeNull();
    expect(disToSidc("x").sidc).toBeNull();
    expect(disToSidc("1.1.70000").sidc).toBeNull();
  });

  it("round-trips every mapped category to a valid code with the same category", () => {
    const tables = dis.names as Record<string, Record<string, string>>;
    for (const domain of [1, 2, 3, 4, 5])
      for (const cat of Object.keys(tables[`1.${domain}`]!)) {
        const r = disToSidc([1, domain, 225, Number(cat)], { forceId: 1 });
        expect(validateSidc(r.sidc).valid, `${domain}.${cat} ${r.sidc}`).toBe(
          true,
        );
        if (r.matchQuality === "equivalent")
          expect(sidcToDis(r.sidc).entityType?.category).toBe(Number(cat));
      }
  });
});

describe("Force ID", () => {
  it("maps affiliations both ways", () => {
    expect([1, 2, 3, 4, 5, 6, 0].map(forceIdToAffiliation)).toEqual([
      "F",
      "H",
      "N",
      "F",
      "H",
      "N",
      "U",
    ]);
    expect(
      ["F", "A", "H", "S", "J", "N", "U", "P"].map(affiliationToForceId),
    ).toEqual([1, 1, 2, 2, 2, 3, 0, 0]);
  });
});
