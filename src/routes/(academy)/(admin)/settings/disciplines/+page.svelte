<script lang="ts">
	import { untrack } from 'svelte';
	import LadderEditor from '#lib/components/LadderEditor.svelte';
	import { localName } from '#lib/academy.js';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { AcademyDiscipline, AcademyDisciplines } from '#lib/api/academy-types.js';
	import { ladderSaveError, toLadderInput } from '#lib/forms/academy-ladder.js';
	import { ladderErrors, type LadderRow } from '#lib/forms/ladder.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Card, StatusChip } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let disciplines = $state<AcademyDisciplines>(untrack(() => data.disciplines));
	let editing = $state<string>();
	let rows = $state<LadderRow[]>([]);
	let rowErrors = $state<string[]>([]);
	let notice = $state<string>();
	let failure = $state<string>();
	let busy = $state(false);

	const name = (d: { nameEn: string; nameAr: string }) => localName(d, data.locale);
	const toError = (e: unknown) => (e instanceof ApiError ? e : new ApiError(0, 'internal_error'));

	function clearMessages() {
		notice = undefined;
		failure = undefined;
	}

	function startEdit(discipline: AcademyDiscipline) {
		clearMessages();
		editing = discipline.id;
		rows = discipline.levels.map((l) => ({ ...l }));
		rowErrors = [];
	}

	async function saveLevels(discipline: AcademyDiscipline) {
		clearMessages();
		rowErrors = ladderErrors(rows);
		if (rowErrors.length > 0) return;
		busy = true;
		try {
			const saved = await api<AcademyDiscipline>(`/academy/disciplines/${discipline.id}/levels`, {
				method: 'PUT',
				body: toLadderInput(rows)
			});
			disciplines.enabled = disciplines.enabled.map((d) => (d.id === saved.id ? saved : d));
			editing = undefined;
			notice = m.discipline_levels_saved();
		} catch (e) {
			const error = toError(e);
			if (error.fields.levels && error.code === 'validation_failed')
				rowErrors = error.fields.levels;
			else failure = ladderSaveError(error, data.locale);
		} finally {
			busy = false;
		}
	}

	async function turnOn(id: string) {
		clearMessages();
		try {
			disciplines = await api<AcademyDisciplines>('/academy/disciplines', {
				method: 'POST',
				body: { disciplineId: id }
			});
			notice = m.discipline_turned_on();
		} catch (e) {
			failure = errorText(toError(e).code);
		}
	}

	async function turnOff(id: string) {
		clearMessages();
		try {
			disciplines = await api<AcademyDisciplines>(`/academy/disciplines/${id}`, {
				method: 'DELETE'
			});
			if (editing === id) editing = undefined;
			notice = m.discipline_turned_off();
		} catch (e) {
			failure = errorText(toError(e).code);
		}
	}
</script>

<svelte:head>
	<title>{m.disciplines_page_title()}</title>
</svelte:head>

<div class="sj-page">
	<div class="sj-stack">
		<h1 class="sj-title">{m.disciplines_page_title()}</h1>
		<p class="sj-muted">{m.disciplines_page_intro()}</p>
	</div>

	{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}

	{#each disciplines.enabled as discipline (discipline.id)}
		{@const lastOne = disciplines.enabled.length === 1}
		<Card raised={editing === discipline.id}>
			<div class="sj-card__head">
				<h2 class="sj-heading">{name(discipline)}</h2>
				{#if editing !== discipline.id}
					<Button variant="secondary" icon="edit" onclick={() => startEdit(discipline)}>
						{m.discipline_edit_levels()}
					</Button>
				{/if}
			</div>
			{#if editing === discipline.id}
				<LadderEditor bind:rows errors={rowErrors} />
				<div class="sj-row">
					<Button disabled={busy} onclick={() => saveLevels(discipline)}>{m.action_save()}</Button>
					<Button variant="quiet" onclick={() => (editing = undefined)}>{m.action_cancel()}</Button>
				</div>
			{:else}
				<ol class="sj-row" role="list" aria-label={m.discipline_levels()}>
					{#each discipline.levels as level (level.id)}
						<li><StatusChip tone="level">{name(level)}</StatusChip></li>
					{/each}
				</ol>
				{#if !lastOne}
					<div class="sj-row">
						<Button
							variant="quiet"
							icon="toggle_off"
							disabled={discipline.inUse}
							onclick={() => turnOff(discipline.id)}
						>
							{m.discipline_turn_off()}
						</Button>
						{#if discipline.inUse}
							<span class="sj-small sj-muted">{m.discipline_in_use_hint()}</span>
						{/if}
					</div>
				{/if}
			{/if}
		</Card>
	{/each}

	<Card>
		<h2 class="sj-heading">{m.disciplines_add_title()}</h2>
		{#if disciplines.available.length === 0}
			<p class="sj-muted">{m.disciplines_none_available()}</p>
		{:else}
			<ul class="available" role="list">
				{#each disciplines.available as discipline (discipline.id)}
					<li>
						<span>{name(discipline)}</span>
						<Button variant="secondary" icon="add" onclick={() => turnOn(discipline.id)}>
							{m.discipline_turn_on()}
						</Button>
					</li>
				{/each}
			</ul>
		{/if}
	</Card>
</div>

<style>
	ol,
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.available li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding-block: var(--space-2);
	}
	.available li + li {
		border-block-start: 1px solid var(--line);
	}
</style>
