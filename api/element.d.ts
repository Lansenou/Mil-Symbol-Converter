/** The part of milsymbol the element uses. */
interface MilsymbolLike {
    Symbol: new (sidc: string, options: {
        size: number;
        standard?: string;
    }) => {
        asSVG(): string;
        isValid(): unknown;
    };
}
/**
 * Registers the element (default tag "sidc-symbol"). Does nothing outside a browser or if the tag
 * is already defined. Returns the element class, or undefined if nothing was registered.
 */
declare function defineSidcSymbol(ms: MilsymbolLike, tagName?: string): CustomElementConstructor | undefined;

export { type MilsymbolLike, defineSidcSymbol };
