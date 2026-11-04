import type {
	PaymentMethod,
	Riders,
	SubscriptionEntry,
	SubscriptionStatus
} from '#lib/api/subscription-types.js';
import type { AcademySummary, Locale } from '#lib/api/types.js';
import { formatDayMonth } from '#lib/format.js';
import { formatMoney } from '#lib/money.js';
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

type CountForms = {
	one: () => string;
	two: () => string;
	few: (count: number) => string;
	many: (count: number) => string;
};

/** Arabic counts one, two, three to ten, and eleven up differently. */
export function countText(n: number, forms: CountForms): string {
	if (n === 1) return forms.one();
	if (n === 2) return forms.two();
	return n <= 10 ? forms.few(n) : forms.many(n);
}

export function monthsText(n: number, locale: Locale): string {
	return countText(n, {
		one: () => m.subscription_months_one({}, { locale }),
		two: () => m.subscription_months_two({}, { locale }),
		few: (count) => m.subscription_months_few({ count }, { locale }),
		many: (count) => m.subscription_months_many({ count }, { locale })
	});
}

export function daysText(n: number, locale: Locale): string {
	return countText(n, {
		one: () => m.count_days_one({}, { locale }),
		two: () => m.count_days_two({}, { locale }),
		few: (count) => m.count_days_few({ count }, { locale }),
		many: (count) => m.count_days_many({ count }, { locale })
	});
}

export function riderCountText(n: number, locale: Locale): string {
	return countText(n, {
		one: () => m.count_riders_one({}, { locale }),
		two: () => m.count_riders_two({}, { locale }),
		few: (count) => m.count_riders_few({ count }, { locale }),
		many: (count) => m.count_riders_many({ count }, { locale })
	});
}

const methodTexts: Record<PaymentMethod, () => string> = {
	instapay: () => m.subscription_method_instapay(),
	cash: () => m.subscription_method_cash(),
	other: () => m.subscription_method_other()
};

export const paymentMethods = Object.keys(methodTexts) as PaymentMethod[];

export const methodText = (method: PaymentMethod) => methodTexts[method]();

/**
 * "Paid month · EGP 1,500 · InstaPay · 15 Nov → 15 Dec · Mona". Academies see their own entries
 * without who recorded them, which would show a platform admin's email.
 */
export function entryText(
	e: SubscriptionEntry,
	locale: Locale,
	{ withMadeBy = true }: { withMadeBy?: boolean } = {}
): string {
	const parts =
		e.kind === 'paid'
			? [
					m.subscription_entry_paid({}, { locale }),
					formatMoney(e.amount ?? 0, 'EGP', locale),
					e.method ? methodText(e.method) : ''
				]
			: [m.subscription_entry_free({}, { locale }), daysText(e.days ?? 0, locale)];
	// The arrow points from the start date the way the language reads.
	const arrow = locale === 'ar' ? '←' : '→';
	parts.push(`${formatDayMonth(e.startsOn, locale)} ${arrow} ${formatDayMonth(e.endsOn, locale)}`);
	if (withMadeBy) parts.push(e.madeBy);
	return parts.filter(Boolean).join(' · ');
}
