import type { Locale } from '#lib/api/types.js';
import { formatDayMonth } from '#lib/format.js';
import { dayName } from '#lib/forms/booking.js';
import { m } from '#lib/paraglide/messages.js';

type Closure = { from: string; to: string; reason: string | null };

const day = (date: string, locale: Locale) =>
	`${dayName(date, locale)} ${formatDayMonth(`${date}T00:00:00Z`, locale)}`;

/** The message staff post in the academy's WhatsApp group; the booking link follows it. */
export function closureShareText(c: Closure, academy: string, locale: Locale): string {
	const reason = c.reason ? `: ${c.reason}` : '';
	return c.from === c.to
		? m.closure_share_one({ academy, day: day(c.from, locale), reason }, { locale })
		: m.closure_share_range(
				{ academy, from: day(c.from, locale), to: day(c.to, locale), reason },
				{ locale }
			);
}
