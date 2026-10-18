<script lang="ts">
	import { resolve } from '$app/paths';
	import { academyMark, localName } from '#lib/academy.js';
	import { rangeLabel } from '#lib/forms/horse.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Button, EmptyState, StatusChip } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const filters = $derived([
		{ id: null, label: m.horses_filter_all(), href: resolve('/(academy)/(admin)/horses') },
		...data.disciplines.enabled.map((d) => ({
			id: d.id,
			label: localName(d, data.locale),
			href: resolve(`/(academy)/(admin)/horses?discipline=${d.id}`)
		}))
	]);
</script>

<svelte:head>
	<title>{m.horses_title()}</title>
</svelte:head>

<div class="sj-page">
	<div class="sj-page-head">
		<div class="sj-stack">
			<h1 class="sj-title">{m.horses_title()}</h1>
			<p class="sj-muted">{m.horses_intro()}</p>
		</div>
		<Button icon="add" href={resolve('/(academy)/(admin)/horses/new')}>{m.horse_new()}</Button>
	</div>

	{#if data.disciplines.enabled.length > 1}
		<nav class="sj-row" aria-label={m.horse_discipline()}>
			{#each filters as filter (filter.id)}
				<a
					class="filter"
					href={filter.href}
					aria-current={data.discipline === filter.id ? 'page' : undefined}
				>
					{filter.label}
				</a>
			{/each}
		</nav>
	{/if}

	{#if data.horses.length === 0}
		<EmptyState icon="horseshoe" title={m.horses_empty_title()}>
			{m.horses_empty_body()}
			{#snippet action()}
				<Button icon="add" href={resolve('/(academy)/(admin)/horses/new')}>{m.horse_new()}</Button>
			{/snippet}
		</EmptyState>
	{:else}
		<ul class="sj-list" role="list">
			{#each data.horses as horse (horse.id)}
				<li>
					<a class="horse" href={resolve('/(academy)/(admin)/horses/[id]', { id: horse.id })}>
						<span class="sj-avatar" aria-hidden="true">{academyMark(horse.name)}</span>
						<span class="main">
							<span class="horse-name">{horse.name}</span>
							<span class="sj-row chips">
								<StatusChip tone="level">{localName(horse.discipline, data.locale)}</StatusChip>
								<StatusChip tone="neutral">{rangeLabel(horse, data.locale)}</StatusChip>
								{#if horse.maxRiderWeightKg}
									<StatusChip tone="neutral"
										>{m.horse_max_weight_chip({ kg: horse.maxRiderWeightKg })}</StatusChip
									>
								{/if}
								{#if horse.unavailableToday}
									<StatusChip tone="pending" dot>{m.horse_unavailable_today()}</StatusChip>
								{/if}
								{#if !horse.isActive}<StatusChip tone="stone">{m.horse_inactive()}</StatusChip>{/if}
							</span>
							<span class="sj-small sj-muted">
								{m.horses_sessions_per_day({ count: horse.maxSessionsPerDay })}
							</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li + li {
		border-block-start: 1px solid var(--line);
	}
	.horse {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		color: inherit;
		text-decoration: none;
	}
	.horse:hover {
		background: var(--hover-veil);
	}
	.main {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-inline-size: 0;
	}
	.horse-name {
		font-weight: 600;
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
