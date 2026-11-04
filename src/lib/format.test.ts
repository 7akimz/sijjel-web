import { describe, expect, it } from 'vitest';
import { formatDate, formatDayMonth, formatMonth, formatWeekday } from './format';

describe('formatDate', () => {
	it('uses Western digits in Arabic', () => {
		expect(formatDate('2026-10-31T12:00:00Z', 'ar')).toMatch(/31/);
		expect(formatDate('2026-10-31T12:00:00Z', 'ar')).not.toMatch(/[٠-٩]/);
	});

	it('writes the day, month and year in English', () => {
		expect(formatDate('2026-10-31T12:00:00Z', 'en')).toBe('31 October 2026');
	});

	it('formats in UTC so the server and the browser render the same day', () => {
		expect(formatDate('2026-10-31T23:30:00Z', 'en')).toBe('31 October 2026');
	});
});

describe('formatDayMonth', () => {
	it('writes the day and short month', () => {
		expect(formatDayMonth('2026-11-01', 'en')).toBe('1 Nov');
	});
});

describe('formatMonth', () => {
	it('writes the month name', () => {
		expect(formatMonth('2026-11-01', 'en')).toBe('November');
		expect(formatMonth('2026-12-01', 'ar')).not.toMatch(/[٠-٩]/);
	});
});

describe('formatWeekday', () => {
	it('writes the short weekday name', () => {
		expect(formatWeekday('2026-11-04', 'en')).toBe('Wed');
		expect(formatWeekday('2026-10-31', 'en')).toBe('Sat');
	});
});
