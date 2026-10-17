import { Hct, SchemeTonalSpot, argbFromHex, hexFromArgb } from '@material/material-color-utilities';

export type AccentVars = { light: Record<string, string>; dark: Record<string, string> };

const HEX = /^#[0-9a-f]{6}$/i;

// Tones follow the design system: accent 40/80, on-accent 100/20, soft 90/30, on-soft 10/90,
// which keeps text on the accent at 4.5:1 or better for any brand colour.
export function accentVars(hex: string): AccentVars {
	if (!HEX.test(hex)) return { light: {}, dark: {} };
	const palette = new SchemeTonalSpot(Hct.fromInt(argbFromHex(hex)), false, 0).primaryPalette;
	const tone = (value: number) => hexFromArgb(palette.tone(value));
	return {
		light: {
			'--accent': tone(40),
			'--on-accent': tone(100),
			'--accent-soft': tone(90),
			'--on-accent-soft': tone(10)
		},
		dark: {
			'--accent': tone(80),
			'--on-accent': tone(20),
			'--accent-soft': tone(30),
			'--on-accent-soft': tone(90)
		}
	};
}

const declarations = (vars: Record<string, string>) =>
	Object.entries(vars)
		.map(([name, value]) => `${name}:${value}`)
		.join(';');

export function accentStyle({ light, dark }: AccentVars): string {
	if (Object.keys(light).length === 0) return '';
	return (
		`<style id="academy-accent">` +
		`:root,[data-theme="light"]{${declarations(light)}}` +
		`[data-theme="dark"]{${declarations(dark)}}` +
		`@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${declarations(dark)}}}` +
		`</style>`
	);
}
