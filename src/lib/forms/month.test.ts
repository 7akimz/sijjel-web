import { describe, expect, it } from 'vitest';
import { firstOfNextMonth } from './month';

describe('firstOfNextMonth', () => {
	it('gives the 1st of the following month, across a year end', () => {
		expect(firstOfNextMonth('2026-10-26')).toBe('2026-11-01');
		expect(firstOfNextMonth('2026-12-15')).toBe('2027-01-01');
	});
});
