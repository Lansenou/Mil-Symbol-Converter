/** The part of a milsymbol `Symbol` that `symbolAnchor` reads. */
interface MilsymbolSymbolLike {
    getAnchor(): {
        x: number;
        y: number;
    };
    getOctagonAnchor?(): {
        x: number;
        y: number;
    };
    options?: {
        direction?: unknown;
    };
    style?: {
        size?: number;
    };
    metadata?: {
        headquarters?: boolean;
        baseGeometry?: {
            bbox?: {
                y2?: number;
            };
        };
    };
}
/**
 * The pixel of `symbol.asSVG()` that belongs on the symbol's map position, for an icon anchor
 * (Leaflet `iconAnchor`, OpenLayers `anchor`) or a CSS offset. `sidc` is the code the symbol was
 * drawn from.
 */
declare function symbolAnchor(symbol: MilsymbolSymbolLike, sidc: string): {
    x: number;
    y: number;
};

/** The part of milsymbol the element uses. */
interface MilsymbolLike {
    Symbol: new (sidc: string, options: {
        size: number;
        standard?: string;
        direction?: number;
        speed?: string;
    }) => {
        asSVG(): string;
        isValid(): unknown;
    } & Partial<MilsymbolSymbolLike>;
}
/**
 * Registers the element (default tag "sidc-symbol"). Does nothing outside a browser or if the tag
 * is already defined. Returns the element class, or undefined if nothing was registered.
 */
declare function defineSidcSymbol(ms: MilsymbolLike, tagName?: string): CustomElementConstructor | undefined;

export { type MilsymbolLike, type MilsymbolSymbolLike, defineSidcSymbol, symbolAnchor };
