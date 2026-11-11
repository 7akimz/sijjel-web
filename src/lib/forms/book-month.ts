import type { MonthPick, MonthTime, MonthView } from '#lib/api/member-types.js';
import { weekStartOf } from './booking.js';

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

function shiftMonth(month: string, by: number): string {
	const [year, mon] = month.split('-').map(Number);
	const day = new Date(Date.UTC(year, mon - 1 + by, 1));
	return day.toISOString().slice(0, 7);
}

// By the 20th staff are usually arranging next month, so the page opens on it from then.
const nextMonthFromDay = 20;

export function monthChoice(
	today: string,
	asked: string | null
): { month: string; thisMonth: string; nextMonth: string } {
	const thisMonth = today.slice(0, 7);
	const nextMonth = shiftMonth(thisMonth, 1);
	const fallback = Number(today.slice(8, 10)) >= nextMonthFromDay ? nextMonth : thisMonth;
	const month =
		asked && monthPattern.test(asked) && (asked === thisMonth || asked === nextMonth)
			? asked
			: fallback;
	return { month, thisMonth, nextMonth };
}

/** How many of a time's dates the rider can have; dates already theirs count. */
export function fit(time: MonthTime): { free: number; total: number } {
	const free = time.dates.filter((d) => d.canBook || d.reason === 'already_booked').length;
	return { free, total: time.dates.length };
}

/** The chosen time for each weekday, keyed by weekday. */
export type Picks = Record<number, string>;

export function picksFrom(current: MonthPick[]): Picks {
	return Object.fromEntries(current.map((p) => [p.weekday, p.start]));
}

export function togglePick(picks: Picks, weekday: number, start: string): Picks {
	const next = { ...picks };
	if (next[weekday] === start) delete next[weekday];
	else next[weekday] = start;
	return next;
}

export function pickList(picks: Picks): MonthPick[] {
	return Object.entries(picks).map(([weekday, start]) => ({ weekday: Number(weekday), start }));
}

/**
 * What booking the picks would do to each date: book it, book it past the plan (only if staff
 * confirm), leave it because the rider already has it, or skip it.
 */
export type PlannedStatus = 'book' | 'over' | 'have' | 'skip';

export interface PlannedDate {
	date: string;
	start: string;
	reason: string;
	status: PlannedStatus;
}

export function plannedDates(view: MonthView, picks: Picks): PlannedDate[] {
	const dates = view.days.flatMap((day) => {
		const start = picks[day.weekday];
		const time = day.times.find((t) => t.start === start);
		return time ? time.dates.map((d) => ({ ...d, start: time.start })) : [];
	});
	dates.sort((a, b) => a.date.localeCompare(b.date));
	const limit = view.limit.lessonsPerMonth;
	let count = view.limit.booked;
	return dates.map((d) => {
		let status: PlannedStatus = 'skip';
		if (d.canBook) {
			count++;
			status = limit !== null && count > limit ? 'over' : 'book';
		} else if (d.reason === 'already_booked') {
			status = 'have';
		}
		return { date: d.date, start: d.start, reason: d.reason, status };
	});
}

export function sessionCount(planned: PlannedDate[]): number {
	return planned.filter((p) => p.status === 'book' || p.status === 'over').length;
}

export function firstName(displayName: string): string {
	return displayName.trim().split(/\s+/)[0] ?? displayName;
}

/** The first day of the booking week a date falls in, for the single staff book page. */
export function weekOfDate(date: string): string {
	return weekStartOf(date);
}
