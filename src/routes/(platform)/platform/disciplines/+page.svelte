<script lang="ts">
	import DisciplineEditor from '#lib/components/DisciplineEditor.svelte';
	import type { Discipline } from '#lib/api/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Card, StatusChip } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let saved = $state<Record<string, Discipline>>({});
	let added = $state<Discipline[]>([]);
	let editing = $state<string>();
	let creating = $state(false);
	let notice = $state<string>();

	const disciplines = $derived([...data.disciplines, ...added].map((d) => saved[d.id] ?? d));
	const label = (item: { nameEn: string; nameAr: string }) =>
		data.locale === 'ar' ? item.nameAr : item.nameEn;

	function onSaved(discipline: Discipline) {
		if (!disciplines.some((d) => d.id === discipline.id)) added = [...added, discipline];
		saved = { ...saved, [discipline.id]: discipline };
		editing = undefined;
		creating = false;
		notice = m.discipline_saved();
	}

	function startEdit(id: string) {
		editing = id;
		creating = false;
		notice = undefined;
	}
</script>

<svelte:head>
	<title>{m.disciplines_title()}</title>
</svelte:head>

<div class="sj-page">
	<div class="sj-page-head">
		<div class="sj-stack">
			<h1 class="sj-title">{m.disciplines_title()}</h1>
			<p class="sj-muted">{m.disciplines_intro()}</p>
		</div>
		{#if !creating}
			<Button icon="add" onclick={() => ((creating = true), (editing = undefined))}>
				{m.discipline_new()}
			</Button>
		{/if}
	</div>

	{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}

	{#if creating}
		<Card raised>
			<div class="sj-stack">
				<h2 class="sj-heading">{m.discipline_new()}</h2>
				<DisciplineEditor onsaved={onSaved} oncancel={() => (creating = false)} />
			</div>
		</Card>
	{/if}

	{#each disciplines as discipline (discipline.id)}
		<Card raised={editing === discipline.id}>
			<div class="sj-stack">
				<div class="sj-card__head">
					<div>
						<h2 class="sj-heading">{label(discipline)}</h2>
						<span class="sj-small sj-muted" dir="ltr">{discipline.key}</span>
					</div>
					{#if editing !== discipline.id}
						<Button variant="secondary" icon="edit" onclick={() => startEdit(discipline.id)}>
							{m.discipline_edit()}
						</Button>
					{/if}
				</div>
				{#if editing === discipline.id}
					<DisciplineEditor {discipline} onsaved={onSaved} oncancel={() => (editing = undefined)} />
				{:else}
					<ol class="sj-row" role="list" aria-label={m.discipline_levels()}>
						{#each discipline.levels as level, index (index)}
							<li><StatusChip tone="level">{label(level)}</StatusChip></li>
						{/each}
					</ol>
				{/if}
			</div>
		</Card>
	{/each}
</div>

<style>
	ol {
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
