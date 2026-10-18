<script lang="ts">
	import { untrack } from 'svelte';
	import PlanForm from '#lib/components/PlanForm.svelte';
	import { localName } from '#lib/academy.js';
	import type { Plan } from '#lib/api/member-types.js';
	import { formatMoney } from '#lib/money.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Card, EmptyState, StatusChip } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let plans = $state<Plan[]>(untrack(() => data.plans));
	let editing = $state<string>();
	let notice = $state<string>();

	const sorted = $derived(
		[...plans].sort(
			(a, b) => Number(b.isActive) - Number(a.isActive) || a.sessionsPerWeek - b.sessionsPerWeek
		)
	);

	function onSaved(plan: Plan) {
		plans = plans.some((p) => p.id === plan.id)
			? plans.map((p) => (p.id === plan.id ? plan : p))
			: [...plans, plan];
		editing = undefined;
		notice = m.plan_saved();
	}
</script>

<svelte:head>
	<title>{m.plans_title()}</title>
</svelte:head>

<div class="sj-page">
	<div class="sj-stack">
		<h1 class="sj-title">{m.plans_title()}</h1>
		<p class="sj-muted">{m.plans_intro()}</p>
	</div>

	{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}

	<Card raised>
		<h2 class="sj-heading">{m.plan_new()}</h2>
		<PlanForm disciplines={data.disciplines} locale={data.locale} onsaved={onSaved} />
	</Card>

	{#if sorted.length === 0}
		<EmptyState icon="payments" title={m.plans_empty_title()}>{m.plans_empty_body()}</EmptyState>
	{:else}
		<ul class="sj-list" role="list">
			{#each sorted as plan (plan.id)}
				{@const name = localName(plan, data.locale)}
				<li class="plan">
					{#if editing === plan.id}
						<PlanForm
							{plan}
							disciplines={data.disciplines}
							locale={data.locale}
							onsaved={onSaved}
							oncancel={() => (editing = undefined)}
						/>
					{:else}
						<div class="row">
							<div class="main">
								<span class="plan-name">{name}</span>
								<span class="sj-row">
									<StatusChip tone="neutral"
										>{m.plan_per_week({ count: plan.sessionsPerWeek })}</StatusChip
									>
									<StatusChip tone="neutral"
										>{formatMoney(plan.monthlyPrice, data.currency, data.locale)}</StatusChip
									>
									{#if plan.discipline}
										<StatusChip tone="level">{localName(plan.discipline, data.locale)}</StatusChip>
									{/if}
									{#if !plan.isActive}<StatusChip tone="stone">{m.plan_retired()}</StatusChip>{/if}
								</span>
							</div>
							<Button
								variant="quiet"
								icon="edit"
								label={m.plan_edit({ name })}
								onclick={() => ((editing = plan.id), (notice = undefined))}
							/>
						</div>
					{/if}
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
	.plan {
		padding: var(--space-3) var(--space-4);
	}
	.plan + .plan {
		border-block-start: 1px solid var(--line);
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}
	.main {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.plan-name {
		font-weight: 600;
	}
</style>
