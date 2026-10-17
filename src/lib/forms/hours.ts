import type { FieldErrors } from '#lib/api/errors.js';
import type { Schedule, ScheduleInput } from '#lib/api/academy-types.js';
import { m } from '#lib/paraglide/messages.js';

export type DayRow = { weekday: number; open: boolean; opensAt: string; closesAt: string };
export type ScheduleBase = Pick<
	ScheduleInput,
	'timeZone' | 'sessionLengthMinutes' | 'breakMinutes'
>;

export const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];

const DEFAULT_OPENS = '18:00';
const DEFAULT_CLOSES = '22:00';
const TIME_PATTERN = /^\d\d:\d\d$/;

export function rowsFromSchedule(s: Schedule): DayRow[] {
	const first = WEEK_ORDER.map((w) => s.days.find((d) => d.weekday === w)).find(Boolean);
	return WEEK_ORDER.map((weekday) => {
		const day = s.days.find((d) => d.weekday === weekday);
		return day
			? { weekday, open: true, opensAt: day.opensAt, closesAt: day.closesAt }
			: {
					weekday,
					open: false,
					opensAt: first?.opensAt ?? DEFAULT_OPENS,
					closesAt: first?.closesAt ?? DEFAULT_CLOSES
				};
	});
}

export function copyToOpenDays(rows: DayRow[], from: number): DayRow[] {
	const source = rows.find((r) => r.weekday === from);
	if (!source) return rows;
	return rows.map((r) =>
		r.open && r.weekday !== from ? { ...r, opensAt: source.opensAt, closesAt: source.closesAt } : r
	);
}

export function toScheduleInput(rows: DayRow[], base: ScheduleBase): ScheduleInput {
	const days = rows
		.filter((r) => r.open)
		.map(({ weekday, opensAt, closesAt }) => ({ weekday, opensAt, closesAt }))
		.sort((a, b) => a.weekday - b.weekday);
	return { ...base, days };
}

export function previewRequestFor(rows: DayRow[], base: ScheduleBase): ScheduleInput | null {
	const incomplete = rows.some(
		(r) => r.open && (!TIME_PATTERN.test(r.opensAt) || !TIME_PATTERN.test(r.closesAt))
	);
	return incomplete ? null : toScheduleInput(rows, base);
}

// Minutes from midnight; a closing time of 00:00 means midnight at the end of the day.
function minutes(time: string, isClose: boolean): number {
	const [hours, mins] = time.split(':').map(Number);
	const total = hours * 60 + mins;
	return isClose && total === 0 ? 24 * 60 : total;
}

const inSteps = (value: number, min: number, max: number) =>
	Number.isInteger(value) && value >= min && value <= max && value % 5 === 0;

export function hoursErrors(rows: DayRow[], base: ScheduleBase): FieldErrors {
	const errors: FieldErrors = {};
	const badDay = rows.some(
		(r) =>
			r.open &&
			(!TIME_PATTERN.test(r.opensAt) ||
				!TIME_PATTERN.test(r.closesAt) ||
				minutes(r.closesAt, true) <= minutes(r.opensAt, false))
	);
	if (badDay) errors.days = ['hours_invalid'];
	if (!inSteps(base.sessionLengthMinutes, 15, 240)) {
		errors.sessionLengthMinutes = ['session_length_invalid'];
	}
	if (!inSteps(base.breakMinutes, 0, 60)) errors.breakMinutes = ['break_invalid'];
	return errors;
}

export function sessionSummary(starts: string[]): string {
	if (starts.length === 0) return m.hours_preview_none();
	if (starts.length === 1) return m.hours_preview_one({ first: starts[0] });
	return m.hours_preview_summary({
		count: starts.length,
		first: starts[0],
		last: starts[starts.length - 1]
	});
}
export { normalizeTime } from '#lib/time.js';
