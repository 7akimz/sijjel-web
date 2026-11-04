import { describe, expect, it } from 'vitest';
import { daySessionsText, isFullDay, lastWeekLine, rideDayLabel, weekSummary } from './horse-rides';

describe('lastWeekLine', () => {
	it('gives the horses list the sessions of the last 7 days and the daily limit', () => {
		expect(lastWeekLine(5, 2, 'en')).toBe('Last 7 days: 5 sessions · limit 2 a day');
		expect(lastWeekLine(1, 3, 'en')).toBe('Last 7 days: 1 session · limit 3 a day');
		expect(lastWeekLine(0, 3, 'en')).toBe('Last 7 days: no sessions · limit 3 a day');
	});

	it('uses the Arabic plural forms', () => {
		expect(lastWeekLine(5, 2, 'ar')).toBe('آخر 7 أيام: 5 حصص · الحد اليومي: 2');
		expect(lastWeekLine(11, 2, 'ar')).toBe('آخر 7 أيام: 11 حصة · الحد اليومي: 2');
		expect(lastWeekLine(0, 2, 'ar')).toBe('آخر 7 أيام: لا حصص · الحد اليومي: 2');
	});
});

describe('weekSummary', () => {
	it('counts sessions and days at the limit', () => {
		expect(weekSummary({ sessions: 5, fullDays: 2 }, 'en')).toBe(
			'Last 7 days · 5 sessions · 2 days at the limit'
		);
		expect(weekSummary({ sessions: 3, fullDays: 1 }, 'en')).toBe(
			'Last 7 days · 3 sessions · 1 day at the limit'
		);
	});

	it('leaves out the limit when no day reached it, and says when there were no sessions', () => {
		expect(weekSummary({ sessions: 3, fullDays: 0 }, 'en')).toBe('Last 7 days · 3 sessions');
		expect(weekSummary({ sessions: 0, fullDays: 0 }, 'en')).toBe('Last 7 days · No sessions');
	});

	it('uses label forms in Arabic', () => {
		expect(weekSummary({ sessions: 5, fullDays: 2 }, 'ar')).toBe(
			'آخر 7 أيام · الحصص: 5 · أيام عند الحد: 2'
		);
	});
});

describe('daySessionsText', () => {
	it('counts the day against the horse limit', () => {
		expect(daySessionsText(2, 2, 'en')).toBe('2 of 2 sessions');
		expect(daySessionsText(1, 3, 'en')).toBe('1 of 3 sessions');
		expect(daySessionsText(2, 2, 'ar')).toBe('الحصص: 2 من 2');
	});

	it('counts alone for a horse with no limit', () => {
		expect(daySessionsText(1, null, 'en')).toBe('1 session');
		expect(daySessionsText(3, null, 'ar')).toBe('الحصص: 3');
	});
});

describe('isFullDay', () => {
	it('is full once the count reaches the limit', () => {
		expect(isFullDay(2, 2)).toBe(true);
		expect(isFullDay(1, 2)).toBe(false);
		expect(isFullDay(4, null)).toBe(false);
	});
});

describe('rideDayLabel', () => {
	it('names the weekday and the full date', () => {
		expect(rideDayLabel('2026-11-03', 'en')).toBe('Tue 3 November 2026');
	});
});
