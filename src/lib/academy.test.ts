import { describe, expect, it } from 'vitest';
import { academyMark, academyName } from './academy';

describe('academy branding', () => {
	const academy = { nameEn: 'Al Faris riding club', nameAr: 'نادي الفارس' };

	it('names the academy in the page language', () => {
		expect(academyName(academy, 'en')).toBe('Al Faris riding club');
		expect(academyName(academy, 'ar')).toBe('نادي الفارس');
	});

	it('marks the academy with the initials of its first two words', () => {
		expect(academyMark('Al Faris riding club')).toBe('AF');
		expect(academyMark('نادي الفارس')).toBe('نا');
		expect(academyMark('  sijjel ')).toBe('S');
	});
});
