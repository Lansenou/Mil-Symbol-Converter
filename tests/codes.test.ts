import { describe, expect, it } from "vitest";
import {
  Affiliation,
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
    expect(sorted(Affiliation)).toEqual(keys(STANDARD_IDENTITIES));
    expect(sorted(Status)).toEqual(keys(...Object.values(STATUSES)));
    expect(sorted(Echelon)).toEqual(keys(ECHELONS));
    expect(sorted(UnitIndicator)).toEqual(keys(HQ_TF_FD));
    expect(sorted(OrderOfBattle)).toEqual(
      keys(...Object.values(ORDERS_OF_BATTLE), { "-": "" }),
    );
  });

  it("isSymbolModifier accepts exactly the table values", () => {
    const table = keys(...Object.values(SYMBOL_MODIFIERS));
    expect(table.every(isSymbolModifier)).toBe(true);
    for (const v of Object.values(SymbolModifier)) expect(table).toContain(v);
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
