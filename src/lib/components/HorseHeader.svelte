<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Horse } from '#lib/api/academy-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { localName } from '#lib/academy.js';
	import { rangeLabel } from '#lib/forms/horse.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Button, StatusChip } from '#lib/ui/index.js';

	type Props = { horse: Horse; locale: Locale; current: 'unavailable' | 'rides' };
	let { horse, locale, current }: Props = $props();

	const tabs = $derived([
		{
			id: 'unavailable',
			label: m.horse_unavailable_title(),
			href: resolve('/(academy)/(admin)/horses/[id]', { id: horse.id })
		},
		{
			id: 'rides',
			label: m.horse_rides_tab(),
			href: resolve('/(academy)/(admin)/horses/[id]/rides', { id: horse.id })
		}
	]);
</script>

<div>
	<Button variant="quiet" icon="arrow_back" href={resolve('/(academy)/(admin)/horses')}>
		{m.horse_back()}
	</Button>
</div>

<header class="head">
	<div class="who">
		<h1 class="sj-title">{horse.name}</h1>
		<div class="sj-row">
			<StatusChip tone="level">{localName(horse.discipline, locale)}</StatusChip>
			<StatusChip tone="neutral">{rangeLabel(horse, locale)}</StatusChip>
			{#if horse.unavailableToday}
				<StatusChip tone="pending" dot>{m.horse_unavailable_today()}</StatusChip>
			{/if}
			{#if !horse.isActive}<StatusChip tone="stone">{m.horse_inactive()}</StatusChip>{/if}
		</div>
		<p class="sj-small sj-muted">
			{m.horses_sessions_per_day({ count: horse.maxSessionsPerDay })}
		</p>
		{#if horse.notes}<p class="sj-small"><bdi>{horse.notes}</bdi></p>{/if}
	</div>
	<Button
		variant="secondary"
		icon="edit"
		label={m.horse_edit()}
		href={resolve('/(academy)/(admin)/horses/[id]/edit', { id: horse.id })}
	/>
</header>

<nav class="tabs" aria-label={m.horse_tabs()}>
	{#each tabs as tab (tab.id)}
		<a class="tab" href={tab.href} aria-current={current === tab.id ? 'page' : undefined}>
			{tab.label}
		</a>
	{/each}
</nav>

<style>
	.head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-3);
	}
	.who {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		min-width: 0;
	}
	.who p {
		margin: 0;
	}
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
