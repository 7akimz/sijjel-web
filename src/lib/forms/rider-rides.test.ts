import { describe, expect, it } from 'vitest';
import { monthCounts, monthTitle } from './rider-rides.js';

describe('monthTitle', () => {
	it('names the month with its year', () => {
		expect(monthTitle('2026-10', 'en')).toBe('October 2026');
	});
});

describe('monthCounts', () => {
	it('counts the rides and the noted ones', () => {
		expect(monthCounts({ month: '2026-10', rides: 21, notes: 5 }, 'en')).toBe('21 rides · 5 notes');
		expect(monthCounts({ month: '2026-10', rides: 1, notes: 1 }, 'en')).toBe('1 ride · 1 note');
	});

	it('leaves out the notes when there are none', () => {
		expect(monthCounts({ month: '2026-09', rides: 9, notes: 0 }, 'en')).toBe('9 rides');
	});

	it('uses the label form in Arabic', () => {
		expect(monthCounts({ month: '2026-10', rides: 21, notes: 5 }, 'ar')).toBe(
			'الحصص: 21 · الملاحظات: 5'
		);
	});
});
