import { useMemo } from "react";
import {
  toRenderableSidc,
  type RenderOptions,
  type RenderableSidc,
} from "../render";

/**
 * Memoized `toRenderableSidc` for React: a code to draw from a SIDC read from data, with what was
 * filled in or left out. The result only changes when the input or an option value changes, so it
 * is safe in dependency arrays. Never throws; `sidc` is null when nothing usable can be made.
 *
 * ```tsx
 * const { sidc, filled } = useRenderableSidc(unit.sidc, { fallback: { affiliation: "Hostile" } });
 * const svg = useMemo(() => (sidc ? new ms.Symbol(sidc).asSVG() : null), [sidc]);
 * ```
 */
export function useRenderableSidc(
  input: string | null | undefined,
  options: RenderOptions = {},
): RenderableSidc {
  const {
    targetStandard,
    preferredSource,
    mil2525dVersion,
    extendedSidc,
    legacy12Profile,
    strictInput,
    fallback = {},
  } = options;
  const { affiliation, status, symbolModifier, countryCode, orderOfBattle } =
    fallback;
  return useMemo(() => {
    const o: RenderOptions = {};
    if (targetStandard !== undefined) o.targetStandard = targetStandard;
    if (preferredSource !== undefined) o.preferredSource = preferredSource;
    if (mil2525dVersion !== undefined) o.mil2525dVersion = mil2525dVersion;
    if (extendedSidc !== undefined) o.extendedSidc = extendedSidc;
    if (legacy12Profile !== undefined) o.legacy12Profile = legacy12Profile;
    if (strictInput !== undefined) o.strictInput = strictInput;
    const f: NonNullable<RenderOptions["fallback"]> = {};
    if (affiliation) f.affiliation = affiliation;
    if (status) f.status = status;
    if (symbolModifier) f.symbolModifier = symbolModifier;
    if (countryCode) f.countryCode = countryCode;
    if (orderOfBattle) f.orderOfBattle = orderOfBattle;
    o.fallback = f;
    return toRenderableSidc(input, o);
  }, [
    input,
    targetStandard,
    preferredSource,
    mil2525dVersion,
    extendedSidc,
    legacy12Profile,
    strictInput,
    affiliation,
    status,
    symbolModifier,
    countryCode,
    orderOfBattle,
  ]);
}
