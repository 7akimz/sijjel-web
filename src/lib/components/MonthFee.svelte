<script lang="ts">
	import type { Locale } from '#lib/api/types.js';
	import { formatMonth } from '#lib/format.js';
	import { formatMoney } from '#lib/money.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Icon } from '#lib/ui/index.js';

	type Props = {
		/** The month the fee is for, as YYYY-MM. */
		month: string;
		paid: boolean;
		amount: number | null;
		currency: string | null;
		locale: Locale;
		busy?: boolean;
		onchange: (paid: boolean) => void;
	};
	let { month, paid, amount, currency, locale, busy = false, onchange }: Props = $props();

	const monthName = $derived(formatMonth(`${month}-01`, locale));
	const price = $derived(
		amount !== null && currency ? formatMoney(amount, currency, locale) : undefined
	);
	const label = $derived(
		paid
			? m.member_fee_mark_unpaid({ month: monthName }, { locale })
			: m.member_fee_mark_paid({ month: monthName }, { locale })
	);
</script>

<!-- One control is both the month's state and the way to change it, like stamping a ticket. -->
<button
	type="button"
	class={['fee', paid && 'fee--paid']}
	aria-pressed={paid}
	aria-label={label}
	disabled={busy}
	onclick={() => onchange(!paid)}
>
	<span class="stamp" aria-hidden="true">
		{#if paid}<Icon name="check" size={20} />{/if}
	</span>
	<span class="what">
		<span class="month">{monthName}</span>
		{#if price}<span class="price" dir="ltr">{price}</span>{/if}
	</span>
	<span class="state"
		>{paid ? m.member_paid_chip({}, { locale }) : m.member_unpaid_chip({}, { locale })}</span
	>
</button>

<style>
	.fee {
		display: inline-flex;
		align-items: center;
		gap: var(--space-3);
		min-height: 44px;
		padding: var(--space-2) var(--space-3) var(--space-2) var(--space-2);
		border: 1.5px dashed var(--brass);
		border-radius: var(--radius-md);
		background: var(--brass-soft);
		color: var(--ink);
		font: inherit;
		text-align: start;
		cursor: pointer;
	}
	.fee:hover {
		border-style: solid;
	}
	.fee:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}
	.fee:disabled {
		cursor: progress;
	}
	.stamp {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		flex-shrink: 0;
		border: 1.5px dashed var(--brass);
		border-radius: var(--radius-pill);
	}
	.what {
		display: flex;
		flex-direction: column;
		line-height: 1.2;
	}
	.month {
		font-weight: 600;
	}
	.price {
		font-size: 0.875em;
		color: var(--ink-muted);
	}
	.state {
		font-weight: 600;
		color: var(--brass);
	}
	.fee--paid {
		border-style: solid;
		border-color: transparent;
		background: var(--paddock-soft);
	}
	.fee--paid .stamp {
		border-style: solid;
		border-color: var(--paddock);
		background: var(--paddock);
		color: var(--paddock-soft);
	}
	.fee--paid .state {
		color: var(--paddock);
	}
	@media (prefers-reduced-motion: no-preference) {
		.stamp {
			transition:
				background-color 160ms ease-out,
				transform 160ms ease-out;
		}
		.fee--paid .stamp {
			transform: rotate(-8deg);
		}
	}
</style>
