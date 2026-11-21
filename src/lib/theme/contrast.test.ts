import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

describe('contrastRatio', () => {
	it('is 21 for black on white', () => {
		expect(contrastRatio('#000000', '#ffffff')).toBe(21);
	});

	it('is 1 for a colour on itself', () => {
		expect(contrastRatio('#ffffff', '#ffffff')).toBe(1);
	});

	it('matches the WCAG ratio for muted olive text on the ground', () => {
		expect(contrastRatio('#60655f', '#f8faf8')).toBeCloseTo(5.68, 2);
	});

	it('gives the same ratio whichever colour comes first', () => {
		expect(contrastRatio('#f8faf8', '#60655f')).toBe(contrastRatio('#60655f', '#f8faf8'));
	});
});
