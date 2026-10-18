import { ApiError, errorText } from '#lib/api/errors.js';
import type { PlanSummary, SlotView } from '#lib/api/member-types.js';
import type { Locale } from '#lib/api/types.js';
import { m } from '#lib/paraglide/messages.js';

type MessageFn = (inputs: object, options: { locale?: Locale }) => string;
const messages = m as unknown as Record<string, MessageFn | undefined>;

export function slotReasonText(reason: string, locale?: Locale): string {
	const message = messages[`slot_reason_${reason}`];
	return message ? message({}, { locale }) : errorText(reason, locale);
}

// Slot codes have a full sentence under error_ for when a booking is refused; a code with only a
// short slot label falls back to that label.
export function bookingErrorText(e: ApiError, locale?: Locale): string {
	if (!messages[`error_${e.code}`] && messages[`slot_reason_${e.code}`]) {
		return slotReasonText(e.code, locale);
	}
	return errorText(e.code, locale);
}

function parseDay(date: string): Date {
	return new Date(`${date}T00:00:00Z`);
}

function formatDay(day: Date): string {
	return day.toISOString().slice(0, 10);
}

export function weekStartOf(date: string): string {
	const day = parseDay(date);
	const sinceSaturday = (day.getUTCDay() + 1) % 7;
	day.setUTCDate(day.getUTCDate() - sinceSaturday);
	return formatDay(day);
}

export function shiftWeek(start: string, weeks: number): string {
	const day = parseDay(start);
	day.setUTCDate(day.getUTCDate() + weeks * 7);
	return formatDay(day);
}

export function weekEndOf(start: string): string {
	const day = parseDay(start);
	day.setUTCDate(day.getUTCDate() + 6);
	return formatDay(day);
}

export function dayName(date: string, locale?: Locale): string {
	return messages[`weekday_${parseDay(date).getUTCDay()}`]!({}, { locale });
}

export function groupByDate(slots: SlotView[]): { date: string; slots: SlotView[] }[] {
	const days: { date: string; slots: SlotView[] }[] = [];
	for (const slot of slots) {
		const last = days.at(-1);
		if (last?.date === slot.date) last.slots.push(slot);
		else days.push({ date: slot.date, slots: [slot] });
	}
	return days;
}

export function riderBlockReason(summary: PlanSummary | null): string | null {
	if (!summary?.plan) return 'no_plan';
	if (summary.unpaidBooking === 'block' && !summary.paidThisMonth) return 'month_unpaid';
	if (summary.horseSource === 'own' && !summary.hasOwnHorse) return 'no_own_horse';
	return null;
}

export function riderBlockText(reason: string, locale?: Locale): string {
	return (messages[`rider_block_${reason}`] ?? messages.error_internal_error!)({}, { locale });
}
