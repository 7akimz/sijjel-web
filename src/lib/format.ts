import type { Locale } from '#lib/api/types.js';

// Western digits in both languages, as the design system requires.
const intlLocale = (locale: Locale) => (locale === 'ar' ? 'ar-u-nu-latn' : 'en-GB');

export function formatDate(iso: string, locale: Locale): string {
	return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'long', timeZone: 'UTC' }).format(
		new Date(iso)
	);
}

/** "1 Nov": a date close enough that the year goes without saying. */
export function formatDayMonth(iso: string, locale: Locale): string {
	return new Intl.DateTimeFormat(intlLocale(locale), {
		day: 'numeric',
		month: 'short',
		timeZone: 'UTC'
	}).format(new Date(iso));
}

export function formatMonth(iso: string, locale: Locale): string {
	return new Intl.DateTimeFormat(intlLocale(locale), { month: 'long', timeZone: 'UTC' }).format(
		new Date(iso)
	);
}

/** "October 2026". */
export function formatMonthYear(iso: string, locale: Locale): string {
	return new Intl.DateTimeFormat(intlLocale(locale), {
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	}).format(new Date(iso));
}

/** "29": the day of the month. */
export function formatDayNumber(iso: string, locale: Locale): string {
	return new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', timeZone: 'UTC' }).format(
		new Date(iso)
	);
}

/** "Wed": the short weekday name. */
export function formatWeekday(iso: string, locale: Locale): string {
	return new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'short', timeZone: 'UTC' }).format(
		new Date(iso)
	);
}
