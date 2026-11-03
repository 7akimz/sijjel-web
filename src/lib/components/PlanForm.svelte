<script lang="ts">
	import { untrack } from 'svelte';
	import { localName } from '#lib/academy.js';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, fieldText, type FieldErrors } from '#lib/api/errors.js';
	import type { AcademyDisciplines } from '#lib/api/academy-types.js';
	import type { Plan } from '#lib/api/member-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { wholeNumber } from '#lib/forms/booking-rules.js';
	import { focusFirstInvalid } from '#lib/forms/focus.js';
	import { planErrors } from '#lib/forms/plan.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, CheckboxField, SelectField, TextField } from '#lib/ui/index.js';

	type Props = {
		plan?: Plan;
		/** The discipline a new plan starts on. */
		discipline?: string;
		disciplines: AcademyDisciplines;
		locale: Locale;
		onsaved: (plan: Plan) => void;
		oncancel?: () => void;
	};
	let { plan, discipline, disciplines, locale, onsaved, oncancel }: Props = $props();

	const initial = untrack(() => plan);
	let nameEn = $state(initial?.nameEn ?? '');
	let nameAr = $state(initial?.nameAr ?? '');
	let lessons = $state<string | number | null>(initial?.lessonsPerMonth ?? 8);
	let price = $state<string | number | null>(initial?.monthlyPrice ?? '');
	let disciplineId = $state(
		untrack(
			() =>
				initial?.discipline?.id ??
				(disciplines.enabled.some((d) => d.id === discipline) ? discipline! : '')
		)
	);
	let levelIds = $state<string[]>(initial?.levels?.map((l) => l.id) ?? []);
	let active = $state(initial?.isActive ?? true);
	let errors = $state<FieldErrors>({});
	let failure = $state<string>();
	let busy = $state(false);
	let formElement = $state<HTMLFormElement>();

	const disciplineOptions = $derived([
		{ value: '', label: m.plan_any_discipline() },
		...disciplines.enabled.map((d) => ({ value: d.id, label: localName(d, locale) }))
	]);
	const formId = $props.id();
	const levelsHelp = $derived(
		fieldText(errors, 'levelIds') ? `${formId}-levels-error` : `${formId}-levels-hint`
	);
	const ladder = $derived(disciplines.enabled.find((d) => d.id === disciplineId)?.levels ?? []);

	function chooseDiscipline(id: string) {
		disciplineId = id;
		levelIds = [];
	}

	function tick(id: string, checked: boolean) {
		levelIds = checked ? [...levelIds, id] : levelIds.filter((l) => l !== id);
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		failure = undefined;
		const body = {
			nameEn: nameEn.trim(),
			nameAr: nameAr.trim(),
			lessonsPerMonth: wholeNumber(lessons),
			monthlyPrice: wholeNumber(price),
			disciplineId: disciplineId || null,
			levelIds: ladder.filter((l) => levelIds.includes(l.id)).map((l) => l.id),
			isActive: active
		};
		errors = planErrors(body);
		if (Object.keys(errors).length > 0) return focusFirstInvalid(formElement);
		busy = true;
		try {
			const saved = initial
				? await api<Plan>(`/academy/plans/${initial.id}`, { method: 'PUT', body })
				: await api<Plan>('/academy/plans', { method: 'POST', body });
			if (!initial) {
				nameEn = nameAr = '';
				price = '';
				levelIds = [];
			}
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

<form method="post" class="sj-stack" bind:this={formElement} onsubmit={submit} novalidate>
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
	<div class="fields">
		<TextField
			label={m.plan_name_en()}
			dir="ltr"
			error={fieldText(errors, 'nameEn')}
			bind:value={nameEn}
		/>
		<TextField
			label={m.plan_name_ar()}
			dir="rtl"
			error={fieldText(errors, 'nameAr')}
			bind:value={nameAr}
		/>
		<TextField
			label={m.plan_lessons()}
			type="number"
			dir="ltr"
			error={fieldText(errors, 'lessonsPerMonth')}
			bind:value={lessons}
		/>
		<TextField
			label={m.plan_price()}
			type="number"
			dir="ltr"
			error={fieldText(errors, 'monthlyPrice')}
			bind:value={price}
		/>
	</div>
	<SelectField
		label={m.plan_discipline()}
		options={disciplineOptions}
		error={fieldText(errors, 'disciplineId')}
		bind:value={() => disciplineId, chooseDiscipline}
	/>
	{#if ladder.length > 0}
		<fieldset class="sj-field levels" aria-describedby={levelsHelp}>
			<legend class="sj-label">{m.plan_levels()}</legend>
			{#each ladder as level (level.id)}
				<CheckboxField
					label={localName(level, locale)}
					checked={levelIds.includes(level.id)}
					invalid={Boolean(fieldText(errors, 'levelIds'))}
					onchange={(checked) => tick(level.id, checked)}
				/>
			{/each}
			{#if fieldText(errors, 'levelIds')}
				<span class="sj-field-error" id="{formId}-levels-error"
					>{fieldText(errors, 'levelIds')}</span
				>
			{:else}
				<span class="sj-hint" id="{formId}-levels-hint">{m.plan_levels_hint()}</span>
			{/if}
		</fieldset>
	{/if}
	{#if initial}<CheckboxField label={m.plan_active()} bind:checked={active} />{/if}
	<div class="sj-row">
		<Button type="submit" icon={initial ? undefined : 'add'} disabled={busy}>
			{initial ? m.action_save() : m.plan_add()}
		</Button>
		{#if oncancel}<Button variant="quiet" onclick={oncancel}>{m.action_cancel()}</Button>{/if}
	</div>
</form>

<style>
	.fields {
		display: grid;
		gap: var(--space-3);
	}
	.levels {
		border: 0;
		margin: 0;
		padding: 0;
	}
	@media (min-width: 720px) {
		.fields {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
