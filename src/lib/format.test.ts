import { describe, expect, it } from 'vitest';
import { formatDate } from './format';

describe('formatDate', () => {
	it('uses Western digits in Arabic', () => {
		expect(formatDate('2026-10-31T12:00:00Z', 'ar')).toMatch(/31/);
		expect(formatDate('2026-10-31T12:00:00Z', 'ar')).not.toMatch(/[٠-٩]/);
	});

	it('writes the day, month and year in English', () => {
		expect(formatDate('2026-10-31T12:00:00Z', 'en')).toBe('31 October 2026');
	});
});
