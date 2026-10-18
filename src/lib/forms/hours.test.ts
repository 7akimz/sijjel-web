import { describe, expect, it } from 'vitest';
import type { Schedule } from '#lib/api/academy-types.js';
import {
	WEEK_ORDER,
	copyToOpenDays,
	hoursErrors,
	normalizeTime,
	previewRequestFor,
	rowsFromSchedule,
	sessionSummary,
	toScheduleInput
} from './hours';

const base = { timeZone: 'Asia/Riyadh', sessionLengthMinutes: 30, breakMinutes: 0 };

const alFaris: Schedule = {
	...base,
	days: [0, 1, 2, 3, 6].map((weekday) => ({ weekday, opensAt: '18:00', closesAt: '22:00' })),
	preview: []
};

describe('hours form', () => {
	it('orders the week from Saturday', () => {
		const rows = rowsFromSchedule(alFaris);

		expect(rows.map((r) => r.weekday)).toEqual([6, 0, 1, 2, 3, 4, 5]);
		expect(WEEK_ORDER).toEqual([6, 0, 1, 2, 3, 4, 5]);
		expect(rows.filter((r) => !r.open).map((r) => r.weekday)).toEqual([4, 5]);
		expect(rows.find((r) => r.weekday === 4)).toMatchObject({
			opensAt: '18:00',
			closesAt: '22:00'
		});
	});

	it('starts closed days at 18:00–22:00 when nothing is open yet', () => {
		const rows = rowsFromSchedule({ ...alFaris, days: [] });

		expect(rows.every((r) => !r.open && r.opensAt === '18:00' && r.closesAt === '22:00')).toBe(
			true
		);
	});

	it('copies one day onto the other open days only', () => {
		const rows = rowsFromSchedule(alFaris).map((r) =>
			r.weekday === 6 ? { ...r, opensAt: '17:00', closesAt: '21:00' } : r
		);

		const copied = copyToOpenDays(rows, 6);

		expect(
			copied.filter((r) => r.open).every((r) => r.opensAt === '17:00' && r.closesAt === '21:00')
		).toBe(true);
		expect(copied.find((r) => r.weekday === 4)).toMatchObject({ open: false, opensAt: '18:00' });
	});

	it('sends only open days, in weekday order', () => {
		const input = toScheduleInput(rowsFromSchedule(alFaris), base);

		expect(input.days).toHaveLength(5);
		expect(input.days[0]).toEqual({ weekday: 0, opensAt: '18:00', closesAt: '22:00' });
		expect(input).toMatchObject(base);
	});

	it('waits for complete times before asking for a preview', () => {
		const rows = rowsFromSchedule(alFaris).map((r) =>
			r.weekday === 6 ? { ...r, opensAt: '18:' } : r
		);

		expect(previewRequestFor(rows, base)).toBeNull();
		expect(previewRequestFor(rowsFromSchedule(alFaris), base)?.days).toHaveLength(5);
	});

	it('mirrors the API rules', () => {
		const rows = rowsFromSchedule(alFaris);
		const withSaturday = (opensAt: string, closesAt: string) =>
			rows.map((r) => (r.weekday === 6 ? { ...r, opensAt, closesAt } : r));

		expect(hoursErrors(rows, base)).toEqual({});
		expect(hoursErrors(withSaturday('18:00', '17:00'), base)).toEqual({ days: ['hours_invalid'] });
		expect(hoursErrors(withSaturday('23:00', '00:00'), base)).toEqual({});
		expect(hoursErrors(rows, { ...base, sessionLengthMinutes: 52 })).toEqual({
			sessionLengthMinutes: ['session_length_invalid']
		});
		expect(hoursErrors(rows, { ...base, breakMinutes: 7 })).toEqual({
			breakMinutes: ['break_invalid']
		});
	});

	it('summarises a day of sessions', () => {
		const starts = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];

		expect(sessionSummary(starts)).toBe('8 sessions · 18:00 – 21:30');
		expect(sessionSummary(['18:00'])).toBe('1 session · 18:00');
		expect(sessionSummary([])).toBe('No session fits these hours');
	});

	it('tidies typed times into 24-hour HH:MM', () => {
		expect(normalizeTime('1800')).toBe('18:00');
		expect(normalizeTime('930')).toBe('09:30');
		expect(normalizeTime('9:30')).toBe('09:30');
		expect(normalizeTime(' 18:00 ')).toBe('18:00');
		expect(normalizeTime('18')).toBe('18:00');
		expect(normalizeTime('2500')).toBe('2500');
		expect(normalizeTime('')).toBe('');
	});

	it('reads midnight, dots and Arabic or Persian digits', () => {
		expect(normalizeTime('24:00')).toBe('00:00');
		expect(normalizeTime('18.30')).toBe('18:30');
		expect(normalizeTime('١٨:٠٠')).toBe('18:00');
		expect(normalizeTime('۱۸۰۰')).toBe('18:00');
	});

	it('rejects hours and minutes out of range', () => {
		const rows = rowsFromSchedule(alFaris);
		const withSaturday = (opensAt: string, closesAt: string) =>
			rows.map((r) => (r.weekday === 6 ? { ...r, opensAt, closesAt } : r));

		expect(hoursErrors(withSaturday('18:00', '25:00'), base)).toEqual({ days: ['hours_invalid'] });
		expect(hoursErrors(withSaturday('18:75', '22:00'), base)).toEqual({ days: ['hours_invalid'] });
	});
});
