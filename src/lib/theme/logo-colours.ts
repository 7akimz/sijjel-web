import { QuantizerCelebi, Score, hexFromArgb } from '@material/material-color-utilities';

export const SIJJEL_BROWN = '#7A5230';

// Score returns the fallback when no colour passes its filter; this one is never a real
// suggestion because the quantizer only produces opaque colours.
const NO_COLOUR = 0x00000000;

/** Ranks a logo's colours as brand colours, best first, from its RGBA bytes. */
export function suggestColours(pixels: Uint8ClampedArray): string[] {
	const argb: number[] = [];
	for (let i = 0; i + 3 < pixels.length; i += 4) {
		if (pixels[i + 3] < 128) continue;
		argb.push(((255 << 24) | (pixels[i] << 16) | (pixels[i + 1] << 8) | pixels[i + 2]) >>> 0);
	}
	if (argb.length === 0) return [];
	const ranked = Score.score(QuantizerCelebi.quantize(argb, 128), {
		desired: 4,
		filter: true,
		fallbackColorARGB: NO_COLOUR
	});
	const hexes = ranked
		.filter((colour) => colour !== NO_COLOUR)
		.map((c) => hexFromArgb(c).toUpperCase());
	return [...new Set(hexes)];
}

/** The swatches to offer: the logo's colours, then the current colour, then the sijjel brown. */
export function swatchesFor(suggested: string[], current: string): string[] {
	const all = [...suggested, current, SIJJEL_BROWN].map((hex) => hex.toUpperCase());
	return [...new Set(all)].slice(0, 6);
}
