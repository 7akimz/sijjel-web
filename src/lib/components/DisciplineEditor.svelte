<script lang="ts">
	import { untrack } from 'svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, type FieldErrors } from '#lib/api/errors.js';
	import type { Discipline } from '#lib/api/types.js';
	import {
		MAX_LEVELS,
		addRow,
		ladderErrors,
		moveRow,
		removeRow,
		trimLadder,
		type LadderRow
	} from '#lib/forms/ladder.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Icon, TextField } from '#lib/ui/index.js';

	type Props = {
		discipline?: Discipline;
		onsaved: (discipline: Discipline) => void;
		oncancel: () => void;
	};
	let { discipline, onsaved, oncancel }: Props = $props();

	const initial = untrack(() => discipline);
	const isNew = !initial;
	let key = $state(initial?.key ?? '');
	let nameEn = $state(initial?.nameEn ?? '');
	let nameAr = $state(initial?.nameAr ?? '');
	let rows = $state<LadderRow[]>(
		initial ? initial.levels.map((l) => ({ ...l })) : [{ nameEn: '', nameAr: '' }]
	);
	let errors = $state<FieldErrors>({});
	let failure = $state<string>();
	let busy = $state(false);

	const fieldError = (field: string) => {
		const code = errors[field]?.[0];
		return code ? errorText(code) : undefined;
	};

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		failure = undefined;
		errors = {};
		const levelCodes = ladderErrors(rows);
		if (!nameEn.trim()) errors.nameEn = ['name_required'];
		if (!nameAr.trim()) errors.nameAr = ['name_required'];
		if (levelCodes.length > 0) errors.levels = levelCodes;
		if (Object.keys(errors).length > 0) return;

		const body = {
			key: key.trim(),
			nameEn: nameEn.trim(),
			nameAr: nameAr.trim(),
			levels: trimLadder(rows)
		};
		busy = true;
		try {
			const saved = discipline
				? await api<Discipline>(`/platform/disciplines/${discipline.id}`, { method: 'PUT', body })
				: await api<Discipline>('/platform/disciplines', { method: 'POST', body });
			onsaved(saved);
		} catch (e) {
			const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
			errors = error.fields;
			if (Object.keys(error.fields).length === 0) failure = errorText(error.code);
		} finally {
			busy = false;
		}
	}
</script>

<form class="sj-stack" onsubmit={submit} novalidate>
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
	{#if isNew}
		<TextField
			label={m.discipline_key()}
			hint={m.discipline_key_hint()}
			error={fieldError('key')}
			dir="ltr"
			autocomplete="off"
			required
			bind:value={key}
		/>
	{/if}
	<TextField
		label={m.discipline_name_en()}
		error={fieldError('nameEn')}
		dir="ltr"
		required
		bind:value={nameEn}
	/>
	<TextField
		label={m.discipline_name_ar()}
		error={fieldError('nameAr')}
		dir="rtl"
		required
		bind:value={nameAr}
	/>

	<fieldset class="sj-stack">
		<legend class="sj-label">{m.discipline_levels()}</legend>
		<ol class="sj-stack" role="list">
			{#each rows as row, index (row)}
				{@const number = index + 1}
				<li class="level">
					<span class="sj-numeral" aria-hidden="true">{number}</span>
					<div class="names">
						<TextField
							label={m.discipline_level_en({ number })}
							dir="ltr"
							bind:value={row.nameEn}
						/>
						<TextField
							label={m.discipline_level_ar({ number })}
							dir="rtl"
							bind:value={row.nameAr}
						/>
					</div>
					<div class="tools">
						<Button
							variant="quiet"
							icon="arrow_upward"
							label={m.discipline_move_up({ number })}
							disabled={index === 0}
							onclick={() => (rows = moveRow(rows, index, index - 1))}
						/>
						<Button
							variant="quiet"
							icon="arrow_downward"
							label={m.discipline_move_down({ number })}
							disabled={index === rows.length - 1}
							onclick={() => (rows = moveRow(rows, index, index + 1))}
						/>
						<Button
							variant="quiet"
							icon="delete"
							label={m.discipline_remove_level({ number })}
							disabled={rows.length === 1}
							onclick={() => (rows = removeRow(rows, index))}
						/>
					</div>
				</li>
			{/each}
		</ol>
		{#each errors.levels ?? [] as code (code)}
			<span class="sj-field-error"><Icon name="error" size={20} />{errorText(code)}</span>
		{/each}
		<div>
			<Button
				variant="secondary"
				icon="add"
				disabled={rows.length >= MAX_LEVELS}
				onclick={() => (rows = addRow(rows))}
			>
				{m.discipline_add_level()}
			</Button>
		</div>
	</fieldset>

	<div class="sj-row">
		<Button type="submit" disabled={busy}>{m.action_save()}</Button>
		<Button variant="quiet" onclick={oncancel}>{m.action_cancel()}</Button>
	</div>
</form>

<style>
	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
	}
	ol {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.level {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--space-2) var(--space-3);
		align-items: start;
		padding-block-end: var(--space-3);
		border-block-end: 1px solid var(--line);
	}
	.level .sj-numeral {
		padding-block-start: var(--space-8);
	}
	.names {
		display: grid;
		gap: var(--space-3);
	}
	.tools {
		grid-column: 2;
		display: flex;
		gap: var(--space-1);
	}
	@media (min-width: 720px) {
		.names {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
