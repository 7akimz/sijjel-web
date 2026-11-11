import { describe, expect, it } from 'vitest';
import type { MonthView } from '#lib/api/member-types.js';
import {
	firstName,
	fit,
	monthChoice,
	picksFrom,
	plannedDates,
	sessionCount,
	togglePick,
	weekOfDate
} from './book-month.js';

const date = (d: string, reason = '') => ({ date: d, canBook: reason === '', reason });

const view = (lessonsPerMonth: number | null, booked = 0): MonthView => ({
	month: '2026-12',
	days: [
		{
			weekday: 6,
			times: [
				{
					start: '18:00',
					end: '18:30',
					dates: [date('2026-12-05'), date('2026-12-12', 'already_booked'), date('2026-12-26')]
				},
				{ start: '19:00', end: '19:30', dates: [date('2026-12-05', 'full')] }
			]
		},
		{
			weekday: 1,
			times: [
				{
					start: '19:00',
					end: '19:30',
					dates: [date('2026-12-07'), date('2026-12-14', 'full'), date('2026-12-28')]
				}
			]
		}
	],
	closed: [],
	current: [],
	limit: { lessonsPerMonth, booked, monthUnpaid: false }
});

describe('monthChoice', () => {
	it('opens this month until the 20th, then next month', () => {
		expect(monthChoice('2026-11-19', null).month).toBe('2026-11');
		expect(monthChoice('2026-11-20', null).month).toBe('2026-12');
	});

	it('takes this month or next when asked, and wraps the year', () => {
		expect(monthChoice('2026-12-03', '2027-01')).toEqual({
			month: '2027-01',
			thisMonth: '2026-12',
			nextMonth: '2027-01'
		});
		expect(monthChoice('2026-12-03', '2026-12').month).toBe('2026-12');
	});

	it('ignores any other month', () => {
		expect(monthChoice('2026-11-03', '2027-02').month).toBe('2026-11');
		expect(monthChoice('2026-11-03', 'nope').month).toBe('2026-11');
	});
});

describe('fit', () => {
	it('counts the dates the rider can have, including ones already theirs', () => {
		expect(fit(view(8).days[0].times[0])).toEqual({ free: 3, total: 3 });
		expect(fit(view(8).days[1].times[0])).toEqual({ free: 2, total: 3 });
	});
});

describe('picks', () => {
	it('starts from the rider usual times and keeps one time per weekday', () => {
		let picks = picksFrom([{ weekday: 6, start: '18:00' }]);
		picks = togglePick(picks, 6, '19:00');
		expect(picks).toEqual({ 6: '19:00' });
		picks = togglePick(picks, 6, '19:00');
		expect(picks).toEqual({});
	});
});

describe('plannedDates', () => {
	it('lists every date in date order with what will happen to it', () => {
		const planned = plannedDates(view(12), { 6: '18:00', 1: '19:00' });

		expect(planned.map((p) => [p.date, p.start, p.status])).toEqual([
			['2026-12-05', '18:00', 'book'],
			['2026-12-07', '19:00', 'book'],
			['2026-12-12', '18:00', 'have'],
			['2026-12-14', '19:00', 'skip'],
			['2026-12-26', '18:00', 'book'],
			['2026-12-28', '19:00', 'book']
		]);
		expect(sessionCount(planned)).toBe(4);
	});

	it('marks the dates past the plan, counting what the month already has', () => {
		const planned = plannedDates(view(4, 2), { 6: '18:00', 1: '19:00' });

		expect(planned.filter((p) => p.status === 'over').map((p) => p.date)).toEqual([
			'2026-12-26',
			'2026-12-28'
		]);
		expect(sessionCount(planned)).toBe(4);
	});

	it('never marks dates over when the rider has no plan', () => {
		expect(plannedDates(view(null), { 6: '18:00' }).some((p) => p.status === 'over')).toBe(false);
	});
});

describe('helpers', () => {
	it('finds the first name and the week a date falls in', () => {
		expect(firstName('Layla Hassan')).toBe('Layla');
		expect(weekOfDate('2026-12-28')).toBe('2026-12-26');
	});
});
