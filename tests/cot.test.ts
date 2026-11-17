import { describe, expect, it } from "vitest";
import { cotToSidc, sidcToCot, validateSidc } from "../src";
import catalog from "../src/data/mil-std-2525c-catalog.json";

describe("sidcToCot", () => {
  it("joins identity, dimension and function ID", () => {
    expect(sidcToCot("SHGPEVAT-------").cot).toBe("a-h-G-E-V-A-T");
    expect(sidcToCot("SFGPIXH---H----").cot).toBe("a-f-G-I-X-H");
    expect(sidcToCot("SFUPS1---------").cot).toBe("a-f-U-S-1");
  });

  it("lists what the type leaves out", () => {
    const r = sidcToCot("SDGAUCI----EUS-");
    expect(r.cot).toBe("a-f-G-U-C-I");
    expect(r.matchQuality).toBe("lossy");
    expect(r.dropped).toHaveLength(4); // exercise, status, echelon, country
  });

  it("reads numeric codes and codes with wildcards", () => {
    expect(sidcToCot("10031000151211000000").cot).toBe("a-f-G-U-C-I");
    expect(sidcToCot("S*G*UCI---*****").cot).toBe("a-u-G-U-C-I");
  });

  it("refuses symbols outside the warfighting scheme", () => {
    expect(sidcToCot("GFGPGPP-------X").cot).toBeNull();
  });
});

describe("cotToSidc", () => {
  it("builds the 2525C code", () => {
    expect(cotToSidc("a-h-G-E-V-A-T").sidc).toBe("SHGPEVAT-------");
    expect(cotToSidc("a-n-G-I-X-H").sidc).toBe("SNGPIXH---H----");
    expect(cotToSidc("a-.-G-U-C-I").sidc).toBe("S*GPUCI--------");
  });

  it("uses the nearest parent for function IDs 2525C does not list", () => {
    const r = cotToSidc("a-f-G-U-C-I-Q");
    expect(r.sidc).toBe("SFGPUCI--------");
    expect(r.matchQuality).toBe("approximate");
  });

  it("stands in unknown for the identities 2525C lacks", () => {
    const r = cotToSidc("a-o-A-M-F-F");
    expect(r.sidc).toBe("SUAPMFF--------");
    expect(r.matchQuality).toBe("approximate");
  });

  it("refuses types that are not atoms", () => {
    expect(cotToSidc("b-m-p-s-p-i").sidc).toBeNull();
    expect(cotToSidc(42).sidc).toBeNull();
  });

  it("round-trips every warfighting symbol in the 2525C tables", () => {
    for (const [template] of catalog as [string, string, string][]) {
      if (template[0] !== "S" || template[2] === "-") continue;
      const code = template.replace(/\*/g, (_, i: number) =>
        i === 1 ? "F" : i === 3 ? "P" : "-",
      );
      const fixed =
        code[2] === "G" && code[4] === "I"
          ? code.slice(0, 10) + "H" + code.slice(11)
          : code;
      const cot = sidcToCot(fixed).cot!;
      const back = cotToSidc(cot);
      expect(back.sidc, `${fixed} ${cot}`).toBe(fixed);
      expect(validateSidc(back.sidc).valid).toBe(true);
    }
  });
});
