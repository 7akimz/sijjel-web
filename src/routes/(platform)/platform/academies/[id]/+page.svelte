<script lang="ts">
	import { resolve } from '$app/paths';
	import { academyName } from '#lib/academy.js';
	import AcademyBookingSetup from '#lib/components/AcademyBookingSetup.svelte';
	import AcademyOwner from '#lib/components/AcademyOwner.svelte';
	import AcademyPackageCard from '#lib/components/AcademyPackageCard.svelte';
	import AcademySetup from '#lib/components/AcademySetup.svelte';
	import AcademySubscription from '#lib/components/AcademySubscription.svelte';
	import type { AcademySubscription as Subscription } from '#lib/api/subscription-types.js';
	import { addedText } from '#lib/forms/academy-page.js';
	import { showsSetup } from '#lib/forms/owner-status.js';
	import { ridersText, statusText, statusTone } from '#lib/forms/subscription.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, StatusChip } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let current = $state<{ academyId: string; sub: Subscription }>();
	const sub = $derived(current?.academyId === data.academy.id ? current.sub : data.subscription);
	const name = $derived(academyName(data.academy, data.locale));
	const now = new Date();
	const academyHref = $derived(
		resolve('/(platform)/platform/academies/[id]', { id: data.academy.id })
	);
	const tabs = $derived([
		{ id: 'overview', label: m.academy_tab_overview(), href: academyHref },
		{ id: 'subscription', label: m.subscription_title(), href: `${academyHref}?tab=subscription` },
		{ id: 'settings', label: m.settings_title(), href: `${academyHref}?tab=settings` }
	]);
	const onchange = (s: Subscription) => (current = { academyId: data.academy.id, sub: s });
</script>

<svelte:head>
	<title>{name}</title>
</svelte:head>

<div class="sj-page">
	<div class="sj-stack">
		<div>
			<Button variant="quiet" icon="arrow_back" href={resolve('/(platform)/platform/academies')}>
				{m.nav_academies()}
			</Button>
		</div>
		<h1 class="sj-title">{name}</h1>
		<div class="sj-row">
			<StatusChip tone={statusTone(sub.status, false)}
				>{statusText(sub.status, data.locale)}</StatusChip
			>
			{#if sub.blocked}<StatusChip tone="danger">{m.subscription_blocked()}</StatusChip>{/if}
			<StatusChip tone="neutral">{ridersText(sub.riders, data.locale)}</StatusChip>
		</div>
	</div>

	<nav class="tabs" aria-label={m.academy_tabs()}>
		{#each tabs as tab (tab.id)}
			<!-- Each href is the resolved academy route, with the view in the query. -->
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a class="tab" href={tab.href} aria-current={data.tab === tab.id ? 'page' : undefined}>
				{tab.label}
			</a>
		{/each}
	</nav>

	{#key data.academy.id}
		{#if data.tab === 'overview'}
			{#if data.added}
				<Banner icon="check_circle">{addedText(name, data.academy, sub.status, data.locale)}</Banner
				>
			{/if}
			<AcademyPackageCard
				academyId={data.academy.id}
				subscription={sub}
				subscriptionHref="{academyHref}?tab=subscription"
				locale={data.locale}
				{onchange}
			/>
			<AcademyOwner academy={data.academy} {now} locale={data.locale} />
			{#if showsSetup(data.academy.owner)}
				<AcademySetup setup={data.academy.setup} locale={data.locale} />
			{/if}
		{:else if data.tab === 'subscription'}
			<AcademySubscription
				academyId={data.academy.id}
				subscription={sub}
				packages={data.packages}
				country={data.academy.country}
				locale={data.locale}
				{onchange}
			/>
		{:else}
			<AcademyBookingSetup
				academyId={data.academy.id}
				country={data.academy.country}
				ridersBook={data.academy.ridersBook}
				countries={data.countries}
				locale={data.locale}
			/>
		{/if}
	{/key}
</div>

<style>
	.tabs {
		display: flex;
		gap: var(--space-4);
		border-block-end: 1px solid var(--line);
	}
	.tab {
		display: inline-flex;
		align-items: center;
		min-block-size: 44px;
		margin-block-end: -1px;
		border-block-end: 2px solid transparent;
		color: var(--ink-muted);
		font-weight: 500;
		text-decoration: none;
	}
	.tab:hover {
		color: var(--ink);
	}
	.tab[aria-current='page'] {
		border-color: var(--accent);
		color: var(--ink);
		font-weight: 600;
	}
</style>
