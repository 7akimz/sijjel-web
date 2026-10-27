<script lang="ts">
	import { untrack } from 'svelte';
	import PackageForm from '#lib/components/PackageForm.svelte';
	import { reveal } from '#lib/reveal.js';
	import { localName } from '#lib/academy.js';
	import type { Package } from '#lib/api/subscription-types.js';
	import { riderCountText } from '#lib/forms/subscription.js';
	import { formatMoney } from '#lib/money.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Card, EmptyState, StatusChip } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let packages = $state<Package[]>(untrack(() => data.packages));
	let editing = $state<string>();
	let notice = $state<string>();
	let saves = $state(0);

	const sorted = $derived(
		[...packages].sort(
			(a, b) =>
				Number(b.isActive) - Number(a.isActive) ||
				(a.maxRiders ?? Infinity) - (b.maxRiders ?? Infinity) ||
				a.monthlyPrice - b.monthlyPrice
		)
	);

	function onSaved(saved: Package) {
		packages = packages.some((p) => p.id === saved.id)
			? packages.map((p) => (p.id === saved.id ? saved : p))
			: [...packages, saved];
		editing = undefined;
		notice = m.package_saved();
		saves++;
	}
</script>

<svelte:head>
	<title>{m.packages_title()}</title>
</svelte:head>

<div class="sj-page">
	<div class="sj-stack">
		<h1 class="sj-title">{m.packages_title()}</h1>
		<p class="sj-muted">{m.packages_intro()}</p>
	</div>

	{#if notice}
		<div use:reveal={saves}><Banner icon="check_circle">{notice}</Banner></div>
	{/if}

	<Card raised>
		<h2 class="sj-heading">{m.package_new()}</h2>
		<PackageForm locale={data.locale} onsaved={onSaved} />
	</Card>

	{#if sorted.length === 0}
		<EmptyState icon="sell" title={m.packages_empty_title()}>{m.packages_empty_body()}</EmptyState>
	{:else}
		<ul class="sj-list" role="list">
			{#each sorted as item (item.id)}
				{@const name = localName(item, data.locale)}
				<li class="package">
					{#if editing === item.id}
						<PackageForm
							initial={item}
							locale={data.locale}
							onsaved={onSaved}
							oncancel={() => (editing = undefined)}
						/>
					{:else}
						<div class="row">
							<div class="main">
								<span class="package-name">{name}</span>
								<span class="sj-row">
									<StatusChip tone="neutral">
										{item.maxRiders === null
											? m.package_unlimited()
											: m.package_up_to({ riders: riderCountText(item.maxRiders, data.locale) })}
									</StatusChip>
									<StatusChip tone="neutral">
										{m.package_per_month({
											price: formatMoney(item.monthlyPrice, 'EGP', data.locale)
										})}
									</StatusChip>
									{#if !item.isActive}<StatusChip tone="stone">{m.package_retired()}</StatusChip
										>{/if}
								</span>
							</div>
							<Button
								variant="quiet"
								icon="edit"
								label={m.package_edit({ name })}
								onclick={() => ((editing = item.id), (notice = undefined))}
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
	.package {
		padding: var(--space-3) var(--space-4);
	}
	.package + .package {
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
	.package-name {
		font-weight: 600;
	}
</style>
