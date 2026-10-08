import { describe, expect, it } from "vitest";
import { compareNames } from "../src/converters/numeric";

describe("compareNames (catalog wording vs meaning)", () => {
  it.each([
    [
      "Movement and Maneuver : Infantry",
      "Movement and Maneuver : Infantry",
      "same",
    ],
    [
      "Military : Fixed Wing : Vertical or Short Take-off and Landing (VSTOL)",
      "Military : Fixed-Wing : VSTOL",
      "renamed",
    ],
    ["Utility Vehicle : Bus", "Utility Vehicles : Bus", "renamed"],
    [
      "Sustainment : Mortuary Affairs",
      "Sustainment : Mortuary Affairs/Graves Registration",
      "renamed",
    ],
    ["Military/Civilian : Mine", "Installation : Mine", "renamed"],
    ["Antisubmarine Warfare", "Palletized Load System", "different"],
    [
      "Protection Lines : Fighting Position",
      "Protection Lines : Fortified Position",
      "different",
    ],
    ["Tow Truck : Light", "Tow Truck : Heavy", "different"],
  ] as const)("%s / %s -> %s", (a, b, expected) => {
    expect(compareNames(a, b)).toBe(expected);
  });
});
