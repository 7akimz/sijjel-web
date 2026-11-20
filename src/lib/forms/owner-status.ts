import type { SubscriptionEntry, SubscriptionStatus } from '#lib/api/subscription-types.js';
import type { CreatedInvite, Locale, OwnerStatus } from '#lib/api/types.js';
import { formatDate, formatDayMonth } from '#lib/format.js';
import { m } from '#lib/paraglide/messages.js';
import { daysText, entryText, statusText, statusTone, type StatusTone } from './subscription';

const dayMs = 24 * 60 * 60 * 1000;

/** Whole calendar days from then to now, counted on UTC dates as the rest of the app shows them. */
function daysSince(then: string, now: Date): number {
	const day = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
	return Math.round((day(now) - day(new Date(then))) / dayMs);
}

/** The chip saying where an academy stands with its owner. */
export function ownerChip(
	o: OwnerStatus,
	now: Date,
	locale: Locale
): { text: string; tone: StatusTone } {
	if (o.state === 'joined')
		return { text: m.owner_joined({ name: o.name ?? '' }, { locale }), tone: 'active' };
	if (o.state === 'expired' && o.expiresAt)
		return {
			text: m.owner_expired({ date: formatDayMonth(o.expiresAt, locale) }, { locale }),
			tone: 'stone'
		};
	if (o.state === 'pending' && o.sentAt) {
		const days = daysSince(o.sentAt, now);
		const text =
			days <= 0
				? m.owner_sent_today({}, { locale })
				: days === 1
					? m.owner_sent_yesterday({}, { locale })
					: m.owner_sent_days_ago({ days: daysText(days, locale) }, { locale });
		return { text, tone: 'pending' };
	}
	return { text: m.owner_none({}, { locale }), tone: 'stone' };
}

/** The status an academy's own admins see: free days read as active, and nothing while they wait. */
export function ownerStatusText(status: SubscriptionStatus, locale: Locale): string | null {
	if (status === 'not_started' || status === 'trial_waiting') return null;
	if (status === 'free') return m.subscription_owner_active({}, { locale });
	return statusText(status, locale);
}

export function ownerStatusTone(status: SubscriptionStatus, blocked: boolean): StatusTone {
	return status === 'free' && !blocked ? 'active' : statusTone(status, blocked);
}

export function ownerDateText(
	status: SubscriptionStatus,
	paidUntil: string | null,
	locale: Locale
): string | null {
	if (!paidUntil) return null;
	const date = formatDate(paidUntil, locale);
	return status === 'free'
		? m.subscription_next_payment({ date }, { locale })
		: m.subscription_paid_until({ date }, { locale });
}

/**
 * An entry as the academy's own admins see it: the first one, when free, is the first month,
 * later free ones are extra time, and who recorded it is left out.
 */
export function ownerEntryText(
	e: SubscriptionEntry,
	isFirst: boolean,
	currency: string,
	locale: Locale
): string {
	if (e.kind === 'paid') return entryText(e, currency, locale, { withMadeBy: false });
	const arrow = locale === 'ar' ? '←' : '→';
	const range = `${formatDayMonth(e.startsOn, locale)} ${arrow} ${formatDayMonth(e.endsOn, locale)}`;
	return isFirst
		? [m.subscription_entry_first_month({}, { locale }), range].join(' · ')
		: [m.subscription_entry_extra_time({}, { locale }), daysText(e.days ?? 0, locale), range].join(
				' · '
			);
}

/** "11 Nov, 3 days ago": when an owner invite was sent. */
export function sentText(sentAt: string, now: Date, locale: Locale): string {
	const days = daysSince(sentAt, now);
	const ago =
		days <= 0
			? m.owner_ago_today({}, { locale })
			: days === 1
				? m.owner_ago_yesterday({}, { locale })
				: m.owner_ago_days({ days: daysText(days, locale) }, { locale });
	return m.owner_sent_on({ date: formatDayMonth(sentAt, locale), ago }, { locale });
}

/** The owner status right after an invite is created or sent again. */
export function pendingOwner(invite: CreatedInvite, name: string | null, now: Date): OwnerStatus {
	return {
		state: 'pending',
		name,
		inviteId: invite.inviteId,
		sentAt: now.toISOString(),
		expiresAt: invite.expiresAt,
		joinedAt: null
	};
}

/** Setup progress means something only once an owner has joined. */
export const showsSetup = (o: OwnerStatus) => o.state === 'joined';
