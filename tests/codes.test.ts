import { describe, expect, it } from "vitest";
import {
  Affiliation,
  AffiliationLetter,
  EchelonLetter,
  OrderOfBattleLetter,
  StatusLetter,
  SymbolModifierLetter,
  UnitIndicatorLetter,
  convertNumericTo2525C,
  Echelon,
  OrderOfBattle,
  Status,
  SymbolModifier,
  UnitIndicator,
  convertSidc,
  echelonModifier,
  isAffiliation,
  isCountryCode,
  isOrderOfBattle,
  isStatus,
  isSymbolModifier,
} from "../src";
import {
  ECHELONS,
  HQ_TF_FD,
  ORDERS_OF_BATTLE,
  STANDARD_IDENTITIES,
  STATUSES,
  SYMBOL_MODIFIERS,
} from "../src/legacy/fields";

const sorted = (o: object) => Object.values(o).sort();
const keys = (...os: object[]) =>
  [...new Set(os.flatMap((o) => Object.keys(o)))].sort();

describe("named codes match the 2525C field tables", () => {
  it("affiliation, status, echelon, indicator, order of battle", () => {
    expect(sorted(AffiliationLetter)).toEqual(keys(STANDARD_IDENTITIES));
    expect(sorted(StatusLetter)).toEqual(keys(...Object.values(STATUSES)));
    expect(sorted(EchelonLetter)).toEqual(keys(ECHELONS));
    expect(sorted(UnitIndicatorLetter)).toEqual(keys(HQ_TF_FD));
    expect(sorted(OrderOfBattleLetter)).toEqual(
      keys(...Object.values(ORDERS_OF_BATTLE), { "-": "" }),
    );
  });

  it("isSymbolModifier accepts exactly the table values", () => {
    const table = keys(...Object.values(SYMBOL_MODIFIERS));
    expect(table.every(isSymbolModifier)).toBe(true);
    for (const v of Object.values(SymbolModifierLetter))
      expect(table).toContain(v);
    expect(["-", "*E", "Z-", "HA", "--X", 5].some(isSymbolModifier)).toBe(
      false,
    );
  });

  it("guards reject other values", () => {
    expect([isAffiliation("X"), isStatus("*"), isOrderOfBattle("Z")]).toEqual([
      false,
      false,
      false,
    ]);
    expect([
      isCountryCode("US"),
      isCountryCode("--"),
      isCountryCode("us"),
    ]).toEqual([true, true, false]);
  });
});

describe("using the names", () => {
  it("converts a template", () => {
    const r = convertSidc("S*G*UCI---*****", {
      affiliation: Affiliation.Hostile,
      status: Status.Present,
      symbolModifier: echelonModifier(
        Echelon.Battalion,
        UnitIndicator.Headquarters,
      ),
      countryCode: "--",
      orderOfBattle: OrderOfBattle.None,
    });
    expect(echelonModifier(Echelon.Battalion, UnitIndicator.Headquarters)).toBe(
      "AF",
    );
    expect(echelonModifier(Echelon.Company)).toBe("-E");
    expect(r.output).toBe(convertSidc("SHGPUCI---AF---").output);
    expect(r.success).toBe(true);
  });
});

describe("full names", () => {
  it("constants read as names, letters are one lookup away", () => {
    expect(Affiliation.Hostile).toBe("Hostile");
    expect(AffiliationLetter[Affiliation.Hostile]).toBe("H");
    const k: keyof typeof Affiliation = "Faker";
    expect(Object.keys(Affiliation)).toContain(k);
  });

  it("overrides accept names (any case) and letters alike", () => {
    const byLetter = convertSidc("S*G*UCI---*****", {
      affiliation: "H",
      status: "P",
      symbolModifier: "-F",
      orderOfBattle: "G",
    });
    const byName = convertSidc("S*G*UCI---*****", {
      affiliation: "Hostile",
      status: Status.Present,
      symbolModifier: echelonModifier("Battalion"),
      orderOfBattle: OrderOfBattle.Ground,
    });
    expect(byName.output).toBe(byLetter.output);
    expect(byName.normalizedInput).toBe("SHGPUCI----F**G");
    expect(
      convertSidc("S*GPUCI---*****", {
        affiliation: "hostile" as Affiliation,
        symbolModifier: SymbolModifier.None,
      }).normalizedInput,
    ).toBe("SHGPUCI-----***");
    expect(
      convertNumericTo2525C("10031000001211000000", {
        orderOfBattle: "Ground",
      }).output,
    ).toBe("SFGPUCI-------G");
  });

  it("guards accept names and letters", () => {
    expect(["Hostile", "H", "hostile"].every(isAffiliation)).toBe(true);
    expect(isSymbolModifier("Installation")).toBe(true);
    expect(isStatus("Present")).toBe(true);
    expect(isOrderOfBattle("Maritime")).toBe(true);
  });
});
