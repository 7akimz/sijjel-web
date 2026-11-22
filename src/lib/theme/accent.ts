import { Hct, SchemeTonalSpot, argbFromHex, hexFromArgb } from '@material/material-color-utilities';

export type AccentVars = { light: Record<string, string>; dark: Record<string, string> };

const HEX = /^#[0-9a-f]{6}$/i;

// Tones follow the design system: accent 40/80, on-accent 100/20, soft 90/30, on-soft 10/90,
// which keeps text on the accent at 4.5:1 or better for any brand colour.
// The soft tones come from Material's secondary palette, the muted one it uses for selected
// navigation, so a saturated brand colour doesn't turn booked cards and chips into a loud pastel.
export function accentVars(hex: string): AccentVars {
	if (!HEX.test(hex)) return { light: {}, dark: {} };
	const scheme = new SchemeTonalSpot(Hct.fromInt(argbFromHex(hex)), false, 0);
	const tone = (value: number) => hexFromArgb(scheme.primaryPalette.tone(value));
	const soft = (value: number) => hexFromArgb(scheme.secondaryPalette.tone(value));
	return {
		light: {
			'--accent': tone(40),
			'--on-accent': tone(100),
			'--accent-soft': soft(90),
			'--on-accent-soft': soft(10)
		},
		dark: {
			'--accent': tone(80),
			'--on-accent': tone(20),
			'--accent-soft': soft(30),
			'--on-accent-soft': soft(90)
		}
	};
}

const declarations = (vars: Record<string, string>) =>
	Object.entries(vars)
		.map(([name, value]) => `${name}:${value}`)
		.join(';');

// The doubled :root outranks the design-system token rules, which load after this tag.
export function accentStyle({ light, dark }: AccentVars): string {
	if (Object.keys(light).length === 0) return '';
	return (
		`<style id="academy-accent">` +
		`:root:root,:root:root[data-theme="light"]{${declarations(light)}}` +
		`:root:root[data-theme="dark"]{${declarations(dark)}}` +
		`@media (prefers-color-scheme: dark){:root:root:not([data-theme="light"]){${declarations(dark)}}}` +
		`</style>`
	);
}
