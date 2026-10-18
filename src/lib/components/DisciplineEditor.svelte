<script lang="ts">
	import { untrack } from 'svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, type FieldErrors } from '#lib/api/errors.js';
	import type { Discipline } from '#lib/api/types.js';
	import LadderEditor from '#lib/components/LadderEditor.svelte';
	import { ladderErrors, trimLadder, type LadderRow } from '#lib/forms/ladder.js';
	import { focusFirstInvalid } from '#lib/forms/focus.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, TextField } from '#lib/ui/index.js';

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
	let formElement = $state<HTMLFormElement>();

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
		if (Object.keys(errors).length > 0) return focusFirstInvalid(formElement);

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
			else focusFirstInvalid(formElement);
		} finally {
			busy = false;
		}
	}
</script>

<form class="sj-stack" bind:this={formElement} onsubmit={submit} novalidate>
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

	<LadderEditor bind:rows errors={errors.levels} />

	<div class="sj-row">
		<Button type="submit" disabled={busy}>{m.action_save()}</Button>
		<Button variant="quiet" onclick={oncancel}>{m.action_cancel()}</Button>
	</div>
</form>
