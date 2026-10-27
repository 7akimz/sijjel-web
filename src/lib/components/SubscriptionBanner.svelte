<script lang="ts">
	import type { Locale, Membership } from '#lib/api/types.js';
	import { formatDate } from '#lib/format.js';
	import { monthsText } from '#lib/forms/subscription.js';
	import { formatMoney } from '#lib/money.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner } from '#lib/ui/index.js';

	type Props = { membership: Membership | null; locale: Locale };
	let { membership, locale }: Props = $props();

	const notice = $derived(membership?.subscription);
	const due = $derived(notice?.paidUntil ? formatDate(notice.paidUntil, locale) : '');
	const adminText = $derived.by(() => {
		if (!notice) return undefined;
		if (notice.blocked) return m.subscription_blocked_admin({}, { locale });
		if (notice.status === 'unpaid')
			return m.subscription_unpaid(
				{
					months: monthsText(notice.monthsUnpaid, locale),
					amount: formatMoney(notice.amountUnpaid, 'EGP', locale),
					date: due
				},
				{ locale }
			);
		if (notice.status === 'due_soon') return m.subscription_due_soon({ date: due }, { locale });
		return undefined;
	});
</script>

{#if adminText && notice}
	<div class="sj-page notice">
		<Banner
			tone={notice.status === 'due_soon' && !notice.blocked ? 'pending' : 'danger'}
			icon="receipt_long"
		>
			<span class="lines">
				<span>{adminText}</span>
				<span>{m.subscription_how_to_pay({}, { locale })}</span>
			</span>
		</Banner>
	</div>
{:else if !notice && membership?.bookingPaused}
	<div class="sj-page notice">
		<Banner tone="pending" icon="pause_circle">{m.error_academy_blocked({}, { locale })}</Banner>
	</div>
{/if}

<style>
	.notice {
		padding-block-end: 0;
	}
	.lines {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
</style>
