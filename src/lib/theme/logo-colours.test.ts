import { describe, expect, it } from 'vitest';
import { suggestColours, swatchesFor } from './logo-colours';

type Rgba = [number, number, number, number];

function pixels(...runs: [Rgba, number][]) {
	const out: number[] = [];
	for (const [colour, count] of runs) for (let i = 0; i < count; i++) out.push(...colour);
	return new Uint8ClampedArray(out);
}

const near = (hex: string, [r, g, b]: Rgba) => {
	const value = parseInt(hex.slice(1), 16);
	const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
	return [r, g, b].every((c, i) => Math.abs(c - channels[i]) <= 12);
};

const navy: Rgba = [41, 52, 79, 255];
const gold: Rgba = [201, 162, 39, 255];

describe('suggestColours', () => {
	it('finds navy in a navy and gold logo', () => {
		const result = suggestColours(pixels([navy, 700], [gold, 300]));

		expect(result.length).toBeGreaterThan(0);
		expect(result.length).toBeLessThanOrEqual(4);
		expect(result.some((hex) => near(hex, navy))).toBe(true);
		expect(result.every((hex) => /^#[0-9A-F]{6}$/.test(hex))).toBe(true);
	});

	it('suggests nothing for a black and white logo', () => {
		expect(suggestColours(pixels([[0, 0, 0, 255], 500], [[255, 255, 255, 255], 500]))).toEqual([]);
	});

	it('skips transparent pixels', () => {
		const result = suggestColours(pixels([[255, 0, 0, 0], 900], [navy, 100]));

		expect(result).toHaveLength(1);
		expect(near(result[0], navy)).toBe(true);
	});
});

describe('swatchesFor', () => {
	it('puts the suggestions first and the sijjel brown last', () => {
		expect(swatchesFor(['#29344F'], '#7A5230')).toEqual(['#29344F', '#7A5230']);
		expect(swatchesFor([], '#1E6B52')).toEqual(['#1E6B52', '#7A5230']);
	});

	it('drops repeats regardless of case and keeps at most six', () => {
		expect(swatchesFor(['#29344f', '#C9A227'], '#29344F')).toEqual([
			'#29344F',
			'#C9A227',
			'#7A5230'
		]);
		expect(
			swatchesFor(['#111111', '#222222', '#333333', '#444444', '#555555'], '#666666')
		).toHaveLength(6);
	});
});
