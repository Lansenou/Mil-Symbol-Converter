import { useMemo } from "react";
import { convertSidc } from "../converters/converter";
import type { ConversionOptions, ConversionResult } from "../types";
import type { CheckedSidc } from "../sidc-literal";

/**
 * Memoized conversion for React. The result object only changes when the input or one of the
 * option values changes, so it is safe to use in dependency arrays. Invalid input never throws;
 * it yields a result with `success: false` and structured `diagnostics`.
 */
export function useSidcConverter<const S extends string>(
  input: CheckedSidc<S>,
  options: ConversionOptions = {},
): ConversionResult {
  const {
    targetStandard,
    affiliation,
    status,
    symbolModifier,
    countryCode,
    orderOfBattle,
    wildcardPolicy,
    allowLossy,
    legacy12Profile,
    mil2525dVersion,
    preferredSource,
    strictInput,
    extendedSidc,
    fuzzy,
    minCertainty,
  } = options;
  return useMemo(() => {
    const o: ConversionOptions = {};
    if (targetStandard !== undefined) o.targetStandard = targetStandard;
    if (affiliation) o.affiliation = affiliation;
    if (status) o.status = status;
    if (symbolModifier) o.symbolModifier = symbolModifier;
    if (countryCode) o.countryCode = countryCode;
    if (orderOfBattle) o.orderOfBattle = orderOfBattle;
    if (wildcardPolicy !== undefined) o.wildcardPolicy = wildcardPolicy;
    if (allowLossy !== undefined) o.allowLossy = allowLossy;
    if (legacy12Profile !== undefined) o.legacy12Profile = legacy12Profile;
    if (mil2525dVersion !== undefined) o.mil2525dVersion = mil2525dVersion;
    if (preferredSource !== undefined) o.preferredSource = preferredSource;
    if (strictInput !== undefined) o.strictInput = strictInput;
    if (extendedSidc !== undefined) o.extendedSidc = extendedSidc;
    if (fuzzy !== undefined) o.fuzzy = fuzzy;
    if (minCertainty !== undefined) o.minCertainty = minCertainty;
    return convertSidc(input, o);
  }, [
    input,
    targetStandard,
    affiliation,
    status,
    symbolModifier,
    countryCode,
    orderOfBattle,
    wildcardPolicy,
    allowLossy,
    legacy12Profile,
    mil2525dVersion,
    preferredSource,
    strictInput,
    extendedSidc,
    fuzzy,
    minCertainty,
  ]);
}
