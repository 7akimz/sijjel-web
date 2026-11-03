<script lang="ts">
	import { untrack } from 'svelte';
	import { localName } from '#lib/academy.js';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, fieldText, type FieldErrors } from '#lib/api/errors.js';
	import type { AcademyDisciplines, Horse } from '#lib/api/academy-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { focusFirstInvalid } from '#lib/forms/focus.js';
	import {
		horseErrors,
		newHorseState,
		rangeAfterDisciplineChange,
		stateFromHorse,
		toHorseInput
	} from '#lib/forms/horse.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, CheckboxField, SelectField, TextField } from '#lib/ui/index.js';

	type Props = {
		disciplines: AcademyDisciplines;
		locale: Locale;
		horse?: Horse;
		onsaved: (horse: Horse) => void;
	};
	let { disciplines, locale, horse, onsaved }: Props = $props();

	const initial = untrack(() => horse);
	let form = $state(initial ? stateFromHorse(initial) : newHorseState(untrack(() => disciplines)));
	let sessions = $state(String(form.maxSessionsPerDay));
	let errors = $state<FieldErrors>({});
	let failure = $state<string>();
	let busy = $state(false);
	let formElement = $state<HTMLFormElement>();

	const disciplineOptions = $derived(
		disciplines.enabled.map((d) => ({ value: d.id, label: localName(d, locale) }))
	);
	const levelOptions = $derived(
		(disciplines.enabled.find((d) => d.id === form.disciplineId)?.levels ?? []).map((l) => ({
			value: l.id,
			label: localName(l, locale)
		}))
	);
	const sessionOptions = [1, 2, 3, 4, 5, 6].map((n) => ({
		value: String(n),
		label: m.horse_sessions_option({ count: n })
	}));

	let shownDiscipline = untrack(() => form.disciplineId);
	$effect(() => {
		if (form.disciplineId === shownDiscipline) return;
		shownDiscipline = form.disciplineId;
		Object.assign(form, rangeAfterDisciplineChange(disciplines, form.disciplineId));
	});

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		failure = undefined;
		form.maxSessionsPerDay = Number(sessions);
		errors = horseErrors(form, disciplines);
		if (Object.keys(errors).length > 0) return focusFirstInvalid(formElement);
		busy = true;
		try {
			const body = toHorseInput(form);
			const saved = initial
				? await api<Horse>(`/academy/horses/${initial.id}`, { method: 'PUT', body })
				: await api<Horse>('/academy/horses', { method: 'POST', body });
			onsaved(saved);
		} catch (e) {
			const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
			errors = error.code === 'horse_name_taken' ? { name: [error.code] } : error.fields;
			if (Object.keys(errors).length === 0) failure = errorText(error.code);
			else focusFirstInvalid(formElement);
		} finally {
			busy = false;
		}
	}
</script>

<form method="post" class="sj-stack" bind:this={formElement} onsubmit={submit} novalidate>
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
	<TextField
		label={m.horse_name()}
		error={fieldText(errors, 'name')}
		required
		bind:value={form.name}
	/>
	<SelectField
		label={m.horse_discipline()}
		options={disciplineOptions}
		error={fieldText(errors, 'disciplineId')}
		bind:value={form.disciplineId}
	/>
	<div class="range">
		<SelectField
			label={m.horse_min_level()}
			options={levelOptions}
			error={fieldText(errors, 'minLevelId')}
			bind:value={form.minLevelId}
		/>
		<SelectField
			label={m.horse_max_level()}
			options={levelOptions}
			error={fieldText(errors, 'maxLevelId')}
			bind:value={form.maxLevelId}
		/>
	</div>
	<SelectField
		label={m.horse_sessions()}
		options={sessionOptions}
		error={fieldText(errors, 'maxSessionsPerDay')}
		bind:value={sessions}
	/>
	<TextField label={m.horse_notes()} error={fieldText(errors, 'notes')} bind:value={form.notes} />
	{#if initial}<CheckboxField label={m.horse_active()} bind:checked={form.isActive} />{/if}
	<div>
		<Button type="submit" icon={initial ? undefined : 'add'} disabled={busy}>
			{initial ? m.action_save() : m.horse_add()}
		</Button>
	</div>
</form>

<style>
	.range {
		display: grid;
		gap: var(--space-3);
	}
	@media (min-width: 720px) {
		.range {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
