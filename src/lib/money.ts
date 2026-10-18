import type { Locale } from '#lib/api/types.js';

// Western digits in both languages, as the design system requires.
export function formatMoney(amount: number, currency: string, locale: Locale): string {
	const tag = locale === 'ar' ? 'ar-u-nu-latn' : 'en-GB';
	return new Intl.NumberFormat(tag, {
		style: 'currency',
		currency,
		currencyDisplay: 'code',
		maximumFractionDigits: 0
	}).format(amount);
}
