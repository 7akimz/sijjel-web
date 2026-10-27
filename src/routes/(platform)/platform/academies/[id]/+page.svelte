<script lang="ts">
	import { resolve } from '$app/paths';
	import { academyName } from '#lib/academy.js';
	import AcademySubscription from '#lib/components/AcademySubscription.svelte';
	import type { AcademySubscription as Subscription } from '#lib/api/subscription-types.js';
	import { formatDate } from '#lib/format.js';
	import { ridersText, statusText, statusTone } from '#lib/forms/subscription.js';
	import { m } from '#lib/paraglide/messages.js';
	import { StatusChip } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let current = $state<{ academyId: string; sub: Subscription }>();
	const sub = $derived(current?.academyId === data.academy.id ? current.sub : data.subscription);
	const name = $derived(academyName(data.academy, data.locale));
</script>

<svelte:head>
	<title>{name}</title>
</svelte:head>

<div class="sj-page">
	<div class="sj-stack">
		<a class="sj-small" href={resolve('/(platform)/platform/academies')}>{m.nav_academies()}</a>
		<h1 class="sj-title">{name}</h1>
		<div class="sj-row">
			<StatusChip tone={statusTone(sub.status, false)}
				>{statusText(sub.status, data.locale)}</StatusChip
			>
			{#if sub.blocked}<StatusChip tone="danger">{m.subscription_blocked()}</StatusChip>{/if}
			<StatusChip tone="neutral">{ridersText(sub.riders, data.locale)}</StatusChip>
		</div>
		{#if sub.paidUntil}
			<p class="sj-muted">
				{m.subscription_paid_until({ date: formatDate(sub.paidUntil, data.locale) })}
			</p>
		{/if}
	</div>

	{#key data.academy.id}
		<AcademySubscription
			academyId={data.academy.id}
			subscription={data.subscription}
			packages={data.packages}
			locale={data.locale}
			onchange={(s) => (current = { academyId: data.academy.id, sub: s })}
		/>
	{/key}
</div>
