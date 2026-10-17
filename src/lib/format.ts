import type { Locale } from '#lib/api/types.js';

// Western digits in both languages, as the design system requires.
const intlLocale = (locale: Locale) => (locale === 'ar' ? 'ar-u-nu-latn' : 'en-GB');

export function formatDate(iso: string, locale: Locale): string {
	return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'long' }).format(new Date(iso));
}
