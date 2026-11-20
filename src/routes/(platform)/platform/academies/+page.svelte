<script lang="ts">
	import { resolve } from '$app/paths';
	import { academyMark, academyName } from '#lib/academy.js';
	import { formatDayMonth } from '#lib/format.js';
	import {
		matchesFilter,
		monthsText,
		ridersText,
		sortByUrgency,
		statusFilters,
		statusText,
		statusTone,
		type StatusFilter
	} from '#lib/forms/subscription.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Button, EmptyState, Icon, SelectField, StatusChip } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let filter = $state<StatusFilter>('all');

	const all = $derived(sortByUrgency(data.academies));
	const academies = $derived(all.filter((a) => matchesFilter(a, filter)));
	const filterOptions = $derived(
		statusFilters.map((f) => ({
			value: f,
			label:
				f === 'all'
					? m.subscription_filter_all()
					: f === 'blocked'
						? m.subscription_blocked()
						: statusText(f, data.locale)
		}))
	);
</script>

<svelte:head>
	<title>{m.academies_title()}</title>
</svelte:head>

<div class="sj-page">
	<div class="sj-page-head">
		<h1 class="sj-title">{m.academies_title()}</h1>
		<Button icon="add" href={resolve('/(platform)/platform/academies/new')}>
			{m.academy_new()}
		</Button>
	</div>

	{#if all.length > 0}
		<SelectField
			label={m.subscription_filter()}
			options={filterOptions}
			bind:value={() => filter, (v) => (filter = v as StatusFilter)}
		/>
	{/if}

	{#if all.length === 0}
		<EmptyState icon="domain" title={m.academies_empty_title()}>
			{m.academies_empty_body()}
		</EmptyState>
	{:else if academies.length === 0}
		<p class="sj-muted">{m.academies_filter_empty()}</p>
	{:else}
		<ul class="sj-list" role="list">
			{#each academies as academy (academy.id)}
				<li>
					<a
						class="academy"
						href={resolve('/(platform)/platform/academies/[id]', { id: academy.id })}
					>
						<span class="sj-avatar" aria-hidden="true">{academyMark(academy.nameEn)}</span>
						<span class="main">
							<span class="name">{academyName(academy, data.locale)}</span>
							<span class="sj-row chips">
								<StatusChip tone={statusTone(academy.status, false)}>
									{statusText(academy.status, data.locale)}
								</StatusChip>
								{#if academy.blocked}
									<StatusChip tone="danger">{m.subscription_blocked()}</StatusChip>
								{/if}
								<span class="sj-small sj-muted">{ridersText(academy.riders, data.locale)}</span>
							</span>
							{#if academy.monthsUnpaid > 0}
								<span class="sj-small">
									{m.subscription_unpaid_months({
										months: monthsText(academy.monthsUnpaid, data.locale)
									})}
								</span>
							{:else if academy.paidUntil}
								<span class="sj-small sj-muted">
									{m.subscription_paid_until({
										date: formatDayMonth(academy.paidUntil, data.locale)
									})}
								</span>
							{/if}
						</span>
						<span class="chevron"><Icon name="chevron_right" size={20} directional /></span>
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
	.academy {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		min-block-size: 64px;
		padding: var(--space-3) var(--space-4);
		color: inherit;
		text-decoration: none;
	}
	.academy:hover {
		background: var(--hover-veil);
	}
	.main {
		flex: 1;
		min-inline-size: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.name {
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.chevron {
		align-self: center;
		color: var(--ink-muted);
	}
</style>
