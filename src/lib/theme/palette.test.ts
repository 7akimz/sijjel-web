import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { accentVars } from './accent';
import { contrastRatio } from './contrast';

const tokensCss = readFileSync('src/lib/styles/tokens.css', 'utf8');
const baseCss = readFileSync('src/lib/styles/base.css', 'utf8');

function block(css: string, selector: string): Record<string, string> {
	const start = css.indexOf(`${selector} {`);
	if (start < 0) throw new Error(`no block for ${selector}`);
	const body = css.slice(start, css.indexOf('}', start));
	return Object.fromEntries(
		[...body.matchAll(/--([a-z-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()])
	);
}

const day = block(tokensCss, ":root,\n[data-theme='light']");
const night = block(tokensCss, "[data-theme='dark']");
const deviceDark = block(baseCss, ":root:not([data-theme='light'])");
const themes = { day, night };

const spec = {
	day: {
		ground: '#f8faf8',
		surface: '#ffffff',
		'surface-sunk': '#eff1ef',
		line: '#d7dad7',
		'line-strong': '#898e87',
		ink: '#1d211c',
		'ink-muted': '#60655f',
		brass: '#4f3422',
		'brass-soft': '#fff7c2',
		paddock: '#2a7e3b',
		'paddock-soft': '#e9f6e9',
		danger: '#ce2c31',
		'on-danger': '#ffffff',
		'danger-soft': '#feebec',
		stone: '#60655f',
		'stone-soft': '#e7e9e7'
	},
	night: {
		ground: '#181917',
		surface: '#212220',
		'surface-sunk': '#111210',
		line: '#383a36',
		'line-strong': '#687066',
		ink: '#eceeec',
		'ink-muted': '#afb5ad',
		brass: '#ffca16',
		'brass-soft': '#302008',
		paddock: '#71d083',
		'paddock-soft': '#1b2a1e',
		danger: '#ff9592',
		'on-danger': '#191111',
		'danger-soft': '#3b1219',
		stone: '#afb5ad',
		'stone-soft': '#282a27'
	}
};

describe('the stable palette', () => {
	it('Day and Night match the spec', () => {
		for (const [theme, values] of Object.entries(spec)) {
			const tokens = themes[theme as keyof typeof themes];
			for (const [name, value] of Object.entries(values)) {
				expect(`${theme} ${name}: ${tokens[name]}`).toBe(`${theme} ${name}: ${value}`);
			}
		}
	});

	it('the default accent is hunter green', () => {
		const hunter = accentVars('#355E3B');
		for (const [name, value] of Object.entries(hunter.light)) {
			expect(`day ${name}: ${day[name.slice(2)]}`).toBe(`day ${name}: ${value}`);
		}
		for (const [name, value] of Object.entries(hunter.dark)) {
			expect(`night ${name}: ${night[name.slice(2)]}`).toBe(`night ${name}: ${value}`);
		}
	});

	it('device dark matches Night', () => {
		expect(deviceDark).toEqual(night);
	});

	it('text is readable', () => {
		const pairs = [
			['ink', 'ground'],
			['ink', 'surface'],
			['ink', 'surface-sunk'],
			['ink-muted', 'ground'],
			['ink-muted', 'surface'],
			['ink-muted', 'surface-sunk'],
			['brass', 'brass-soft'],
			['paddock', 'paddock-soft'],
			['danger', 'danger-soft'],
			['stone', 'stone-soft'],
			['on-accent', 'accent'],
			['on-accent-soft', 'accent-soft'],
			['on-danger', 'danger']
		];
		for (const [theme, tokens] of Object.entries(themes)) {
			for (const [text, ground] of pairs) {
				const ratio = contrastRatio(tokens[text], tokens[ground]);
				expect(ratio, `${theme} ${text} on ${ground}`).toBeGreaterThanOrEqual(4.5);
			}
		}
	});

	it('borders are visible', () => {
		for (const [theme, tokens] of Object.entries(themes)) {
			for (const ground of ['surface', 'ground']) {
				const ratio = contrastRatio(tokens['line-strong'], tokens[ground]);
				expect(ratio, `${theme} line-strong on ${ground}`).toBeGreaterThanOrEqual(3);
			}
		}
	});

	it('no brown rgba left', () => {
		for (const brown of ['rgba(42, 33, 26', 'rgba(255, 244, 230', 'rgba(23, 19, 15']) {
			expect(tokensCss + baseCss).not.toContain(brown);
		}
	});
});
