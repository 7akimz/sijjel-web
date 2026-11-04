<script lang="ts">
	import { untrack } from 'svelte';
	import ArenaForm from '#lib/components/ArenaForm.svelte';
	import SetupNext from '#lib/components/SetupNext.svelte';
	import { reveal } from '#lib/reveal.js';
	import type { Arena } from '#lib/api/academy-types.js';
	import { riderCountText } from '#lib/forms/subscription.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Card, EmptyState, StatusChip } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let arenas = $state<Arena[]>(untrack(() => data.arenas));
	let editing = $state<string>();
	let notice = $state<string>();
	let saves = $state(0);

	const sorted = $derived(
		[...arenas].sort(
			(a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name)
		)
	);

	function onSaved(arena: Arena) {
		arenas = arenas.some((a) => a.id === arena.id)
			? arenas.map((a) => (a.id === arena.id ? arena : a))
			: [...arenas, arena];
		editing = undefined;
		notice = m.arena_saved();
		saves++;
	}
</script>

<svelte:head>
	<title>{m.arenas_title()}</title>
</svelte:head>

<div class="sj-page">
	<div class="sj-stack">
		<h1 class="sj-title">{m.arenas_title()}</h1>
		<p class="sj-muted">{m.arenas_intro()}</p>
	</div>

	{#if notice}
		<div class="sj-stack" use:reveal={saves}>
			<Banner icon="check_circle">{notice}</Banner>
			{#if data.setup && arenas.some((a) => a.isActive)}
				<SetupNext state={data.setup} current="arenas" />
			{/if}
		</div>
	{:else if data.setup && arenas.some((a) => a.isActive)}
		<SetupNext state={data.setup} current="arenas" />
	{/if}

	<Card raised>
		<h2 class="sj-heading">{m.arena_new()}</h2>
		<ArenaForm onsaved={onSaved} />
	</Card>

	{#if sorted.length === 0}
		<EmptyState icon="fence" title={m.arenas_empty_title()}>{m.arenas_empty_body()}</EmptyState>
	{:else}
		<ul class="sj-list" role="list">
			{#each sorted as arena (arena.id)}
				<li class="arena">
					{#if editing === arena.id}
						<ArenaForm {arena} onsaved={onSaved} oncancel={() => (editing = undefined)} />
					{:else}
						<div class="row">
							<div class="main">
								<span class="arena-name">{arena.name}</span>
								<span class="sj-small sj-muted">{riderCountText(arena.capacity, data.locale)}</span>
							</div>
							{#if !arena.isActive}<StatusChip tone="stone">{m.arena_inactive()}</StatusChip>{/if}
							<Button
								variant="quiet"
								icon="edit"
								label={m.arena_edit({ name: arena.name })}
								onclick={() => ((editing = arena.id), (notice = undefined))}
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
	.arena {
		padding: var(--space-3) var(--space-4);
	}
	.arena + .arena {
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
	}
	.arena-name {
		font-weight: 600;
	}
</style>
