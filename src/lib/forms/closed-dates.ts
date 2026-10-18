import type { ClosedRange } from '#lib/api/academy-types.js';
import type { FieldErrors } from '#lib/api/errors.js';
import type { Locale } from '#lib/api/types.js';
import { formatDate } from '#lib/format.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_REASON = 120;

export type DateRangeForm = { from: string; to: string; reason: string };

export function closedRangeErrors(r: DateRangeForm): FieldErrors {
	const errors: FieldErrors = {};
	if (!DATE_PATTERN.test(r.from)) errors.from = ['date_range_invalid'];
	else if (!DATE_PATTERN.test(r.to) || r.to < r.from) errors.to = ['date_range_invalid'];
	if ([...r.reason.trim()].length > MAX_REASON) errors.reason = ['reason_too_long'];
	return errors;
}

export function toDateRangeInput(r: DateRangeForm) {
	const reason = r.reason.trim();
	return { from: r.from, to: r.to, reason: reason || null };
}

export function isPast(r: ClosedRange, today: string): boolean {
	return r.to < today;
}

export function formatRange(r: { from: string; to: string }, locale: Locale): string {
	const from = formatDate(`${r.from}T00:00:00Z`, locale);
	return r.from === r.to ? from : `${from} – ${formatDate(`${r.to}T00:00:00Z`, locale)}`;
}
