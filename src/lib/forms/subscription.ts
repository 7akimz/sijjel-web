import type { Riders, SubscriptionStatus } from '#lib/api/subscription-types.js';
import type { AcademySummary, Locale } from '#lib/api/types.js';
import { m } from '#lib/paraglide/messages.js';

export type StatusTone = 'active' | 'pending' | 'danger' | 'stone' | 'neutral';

export function statusTone(status: SubscriptionStatus, blocked: boolean): StatusTone {
	if (blocked || status === 'unpaid') return 'danger';
	if (status === 'due_soon') return 'pending';
	if (status === 'paid') return 'active';
	if (status === 'free') return 'neutral';
	return 'stone';
}

export function statusText(status: SubscriptionStatus, locale: Locale): string {
	const texts: Record<SubscriptionStatus, () => string> = {
		no_package: () => m.subscription_status_no_package({}, { locale }),
		free: () => m.subscription_status_free({}, { locale }),
		paid: () => m.subscription_status_paid({}, { locale }),
		due_soon: () => m.subscription_status_due_soon({}, { locale }),
		unpaid: () => m.subscription_status_unpaid({}, { locale })
	};
	return texts[status]();
}

export type StatusFilter =
	'all' | 'unpaid' | 'due_soon' | 'blocked' | 'free' | 'paid' | 'no_package';

export const statusFilters: StatusFilter[] = [
	'all',
	'unpaid',
	'due_soon',
	'blocked',
	'free',
	'paid',
	'no_package'
];

export function matchesFilter(a: AcademySummary, f: StatusFilter): boolean {
	if (f === 'all') return true;
	if (f === 'blocked') return a.blocked;
	return a.status === f;
}

/** Most months owed first, then due soon, then the soonest paid until, academies without a package last. */
export function sortByUrgency(list: AcademySummary[]): AcademySummary[] {
	const rank = (a: AcademySummary) => (a.monthsUnpaid > 0 ? 0 : a.status === 'due_soon' ? 1 : 2);
	return [...list].sort(
		(a, b) =>
			rank(a) - rank(b) ||
			b.monthsUnpaid - a.monthsUnpaid ||
			(a.paidUntil ?? '9999').localeCompare(b.paidUntil ?? '9999') ||
			a.nameEn.localeCompare(b.nameEn)
	);
}

export function ridersText(r: Riders, locale: Locale): string {
	return r.limit === null
		? m.subscription_riders({ count: r.count }, { locale })
		: m.subscription_riders_of({ count: r.count, limit: r.limit }, { locale });
}

/** Arabic counts one, two, three to ten, and eleven up differently. */
export function monthsText(n: number, locale: Locale): string {
	if (n === 1) return m.subscription_months_one({}, { locale });
	if (n === 2) return m.subscription_months_two({}, { locale });
	if (n <= 10) return m.subscription_months_few({ count: n }, { locale });
	return m.subscription_months_many({ count: n }, { locale });
}
