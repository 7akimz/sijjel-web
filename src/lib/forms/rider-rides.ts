import type { RiderRideMonth } from '#lib/api/member-types.js';
import type { Locale } from '#lib/api/types.js';
import { formatMonthYear } from '#lib/format.js';
import { m } from '#lib/paraglide/messages.js';
import { countText } from './subscription.js';

/** "October 2026" for a YYYY-MM month. */
export function monthTitle(month: string, locale: Locale): string {
	return formatMonthYear(`${month}-01`, locale);
}

/** "21 rides · 5 notes", leaving out the notes when there are none; a label form in Arabic. */
export function monthCounts(month: RiderRideMonth, locale: Locale): string {
	const rides = countText(month.rides, {
		one: () => m.rider_rides_count_one({}, { locale }),
		two: () => m.rider_rides_count_two({}, { locale }),
		few: (count) => m.rider_rides_count_few({ count }, { locale }),
		many: (count) => m.rider_rides_count_many({ count }, { locale })
	});
	if (month.notes === 0) return rides;
	const notes = countText(month.notes, {
		one: () => m.rider_rides_notes_one({}, { locale }),
		two: () => m.rider_rides_notes_two({}, { locale }),
		few: (count) => m.rider_rides_notes_few({ count }, { locale }),
		many: (count) => m.rider_rides_notes_many({ count }, { locale })
	});
	return `${rides} · ${notes}`;
}
