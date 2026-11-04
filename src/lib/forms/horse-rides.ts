import type { HorseLoad } from '#lib/api/academy-types.js';
import type { Locale } from '#lib/api/types.js';
import { formatDate, formatWeekday } from '#lib/format.js';
import { m } from '#lib/paraglide/messages.js';
import { countText } from './subscription.js';

function sessionsText(n: number, locale: Locale): string {
	return countText(n, {
		one: () => m.count_sessions_one({}, { locale }),
		two: () => m.count_sessions_two({}, { locale }),
		few: (count) => m.count_sessions_few({ count }, { locale }),
		many: (count) => m.count_sessions_many({ count }, { locale })
	});
}

/** The count on the ride history, a label form in Arabic ("al-hisas: 3"). */
function rideSessionsText(n: number, locale: Locale): string {
	return countText(n, {
		one: () => m.horse_rides_sessions_one({}, { locale }),
		two: () => m.horse_rides_sessions_two({}, { locale }),
		few: (count) => m.horse_rides_sessions_few({ count }, { locale }),
		many: (count) => m.horse_rides_sessions_many({ count }, { locale })
	});
}

function fullDaysText(n: number, locale: Locale): string {
	return countText(n, {
		one: () => m.horse_rides_full_one({}, { locale }),
		two: () => m.horse_rides_full_two({}, { locale }),
		few: (count) => m.horse_rides_full_few({ count }, { locale }),
		many: (count) => m.horse_rides_full_many({ count }, { locale })
	});
}

/** The horses list line: "Last 7 days: 5 sessions · limit 2 a day". */
export function lastWeekLine(sessions: number, max: number, locale: Locale): string {
	const text =
		sessions === 0 ? m.horses_last_week_none({}, { locale }) : sessionsText(sessions, locale);
	return m.horses_last_week({ sessions: text, max }, { locale });
}

/** "Last 7 days · 5 sessions · 2 days at the limit", leaving out the limit when no day reached it. */
export function weekSummary(load: HorseLoad, locale: Locale): string {
	const parts: string[] = [m.horse_rides_week({}, { locale })];
	if (load.sessions === 0) parts.push(m.horse_rides_week_none({}, { locale }));
	else parts.push(rideSessionsText(load.sessions, locale));
	if (load.fullDays > 0) parts.push(fullDaysText(load.fullDays, locale));
	return parts.join(' · ');
}

export function daySessionsText(count: number, max: number | null, locale: Locale): string {
	if (max === null) return rideSessionsText(count, locale);
	return m.horse_rides_of({ count, max }, { locale });
}

export function isFullDay(count: number, max: number | null): boolean {
	return max !== null && count >= max;
}

/** "Tue 3 November 2026". */
export function rideDayLabel(iso: string, locale: Locale): string {
	return `${formatWeekday(iso, locale)} ${formatDate(iso, locale)}`;
}
