<script lang="ts">
	import type { Locale } from '#lib/api/types.js';
	import { formatMonth } from '#lib/format.js';
	import { formatMoney } from '#lib/money.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Button, StatusChip } from '#lib/ui/index.js';

	type Props = {
		/** The month the fee is for, as YYYY-MM. */
		month: string;
		amount: number | null;
		currency: string | null;
		locale: Locale;
		busy?: boolean;
		onmarkpaid: () => void;
	};
	let { month, amount, currency, locale, busy = false, onmarkpaid }: Props = $props();

	const monthName = $derived(formatMonth(`${month}-01`, locale));
	const price = $derived(
		amount !== null && currency ? formatMoney(amount, currency, locale) : undefined
	);
</script>

<section class="sj-stack section">
	<h2 class="sj-heading">{m.member_this_month({}, { locale })}</h2>
	<div class="sj-list">
		<!-- An unpaid month is waiting on staff, so it takes the highlighted row the members list uses for that. -->
		<div class="sj-list__row sj-list__row--highlight">
			<div class="sj-list__main">
				<span class="month">{monthName}</span>
				{#if price}<span class="sj-small sj-muted" dir="ltr">{price}</span>{/if}
			</div>
			<StatusChip tone="pending" dot>{m.member_unpaid_chip({}, { locale })}</StatusChip>
			<Button icon="check" disabled={busy} onclick={onmarkpaid}
				>{m.member_mark_paid({}, { locale })}</Button
			>
		</div>
	</div>
</section>

<style>
	.section {
		gap: var(--space-2);
	}
	.month {
		font-weight: 600;
	}
</style>
