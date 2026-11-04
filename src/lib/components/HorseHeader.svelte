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

<nav class="sj-row" aria-label={m.horse_tabs()}>
	{#each tabs as tab (tab.id)}
		<a class="filter" href={tab.href} aria-current={current === tab.id ? 'page' : undefined}>
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
	.filter {
		display: inline-flex;
		align-items: center;
		min-block-size: 44px;
		padding-inline: var(--space-4);
		border: 1px solid var(--line-strong);
		border-radius: 999px;
		color: inherit;
		text-decoration: none;
	}
	.filter[aria-current='page'] {
		background: var(--accent-soft);
		color: var(--on-accent-soft);
		border-color: transparent;
		font-weight: 600;
	}
</style>
