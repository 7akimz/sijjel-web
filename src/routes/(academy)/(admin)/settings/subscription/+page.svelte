<script lang="ts">
	import { localName } from '#lib/academy.js';
	import { formatDate } from '#lib/format.js';
	import {
		entryText,
		monthsText,
		ridersText,
		statusText,
		statusTone
	} from '#lib/forms/subscription.js';
	import { formatMoney } from '#lib/money.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Card, EmptyState, StatusChip } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const sub = $derived(data.subscription);
</script>

<svelte:head>
	<title>{m.subscription_title()}</title>
</svelte:head>

<div class="sj-page">
	<h1 class="sj-title">{m.subscription_title()}</h1>

	{#if !sub.package}
		<EmptyState icon="receipt_long" title={m.subscription_none()}>
			{ridersText(sub.riders, data.locale)}
		</EmptyState>
	{:else}
		<Card>
			<div class="sj-stack">
				<h2 class="sj-heading">{localName(sub.package, data.locale)}</h2>
				<p>
					{m.package_per_month({
						price: formatMoney(sub.package.monthlyPrice, 'EGP', data.locale)
					})}
				</p>
				<p>{ridersText(sub.riders, data.locale)}</p>
				<div class="sj-row">
					<StatusChip tone={statusTone(sub.status, sub.blocked)}>
						{statusText(sub.status, data.locale)}
					</StatusChip>
					{#if sub.blocked}<StatusChip tone="danger">{m.subscription_blocked()}</StatusChip>{/if}
				</div>
				{#if sub.paidUntil}
					<p class="sj-muted">
						{m.subscription_paid_until({ date: formatDate(sub.paidUntil, data.locale) })}
					</p>
				{/if}
				{#if sub.status === 'unpaid'}
					<p>
						{m.subscription_unpaid_owed({
							months: monthsText(sub.monthsUnpaid, data.locale),
							amount: formatMoney(sub.amountUnpaid, 'EGP', data.locale)
						})}
					</p>
				{/if}
				<p class="sj-muted">{m.subscription_how_to_pay()}</p>
			</div>
		</Card>

		{#if sub.entries.length > 0}
			<Card>
				<div class="sj-stack">
					<h2 class="sj-heading">{m.subscription_recent()}</h2>
					<ul class="entries" role="list">
						{#each sub.entries as e (e.id)}
							<li>{entryText(e, data.locale)}</li>
						{/each}
					</ul>
				</div>
			</Card>
		{/if}
	{/if}
</div>

<style>
	.entries {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: var(--space-2);
	}
</style>
