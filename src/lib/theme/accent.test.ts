import { describe, expect, it } from 'vitest';
import { accentStyle, accentVars } from './accent';

function luminance(hex: string): number {
	const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
	const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

describe('accentVars', () => {
	it('derives day and night accent tokens from a brand colour', () => {
		const vars = accentVars('#1E6B52');

		for (const theme of [vars.light, vars.dark]) {
			for (const name of ['--accent', '--on-accent', '--accent-soft', '--on-accent-soft']) {
				expect(theme[name]).toMatch(/^#[0-9a-f]{6}$/);
			}
		}
	});

	it('keeps text on the accent readable for difficult brand colours', () => {
		for (const seed of ['#1E6B52', '#FFE45C', '#000000', '#FFFFFF', '#C2185B', '#7A5230']) {
			const { light, dark } = accentVars(seed);
			for (const theme of [light, dark]) {
				expect(contrast(theme['--accent'], theme['--on-accent'])).toBeGreaterThanOrEqual(4.5);
				expect(contrast(theme['--accent-soft'], theme['--on-accent-soft'])).toBeGreaterThanOrEqual(
					4.5
				);
			}
		}
	});

	it('ignores malformed colours', () => {
		expect(accentVars('teal')).toEqual({ light: {}, dark: {} });
		expect(accentVars('#12345')).toEqual({ light: {}, dark: {} });
	});
});

describe('accentStyle', () => {
	it('covers explicit dark and the device setting', () => {
		const style = accentStyle(accentVars('#1E6B52'));

		expect(style).toContain('<style id="academy-accent">');
		expect(style).toContain('[data-theme="dark"]');
		expect(style).toContain('@media (prefers-color-scheme: dark)');
		expect(accentStyle(accentVars('teal'))).toBe('');
	});
});
