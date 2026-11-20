import type { Package, SubscriptionStatus } from '#lib/api/subscription-types.js';
import type { AcademySummary, Locale } from '#lib/api/types.js';
import { riderCountText } from '#lib/forms/subscription.js';
import { formatMoney } from '#lib/money.js';
import { m } from '#lib/paraglide/messages.js';

export type AcademyTab = 'overview' | 'subscription' | 'settings';

export function academyTab(param: string | null): AcademyTab {
	return param === 'subscription' || param === 'settings' ? param : 'overview';
}

/** The banner shown on the academy page right after the New academy flow. */
export function addedText(
	name: string,
	academy: Pick<AcademySummary, 'owner'>,
	status: SubscriptionStatus,
	locale: Locale
): string {
	const { state, name: owner } = academy.owner;
	if (status === 'trial_waiting' && (state === 'pending' || state === 'expired') && owner) {
		return m.academy_added_waiting({ name, owner }, { locale });
	}
	return m.academy_added({ name }, { locale });
}

/** "Up to 25 riders" or "Unlimited riders". */
export function packageLimitText(p: Package, locale: Locale): string {
	return p.maxRiders == null
		? m.package_unlimited({}, { locale })
		: m.package_up_to({ riders: riderCountText(p.maxRiders, locale) }, { locale });
}

/** "EGP 1,500 a month". */
export function packagePriceText(p: Package, locale: Locale): string {
	return m.package_per_month(
		{ price: formatMoney(p.monthlyPrice, p.currency, locale) },
		{ locale }
	);
}
