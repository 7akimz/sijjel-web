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
		disciplines: AcademyDisciplines;
		locale: Locale;
		onsaved: (plan: Plan) => void;
		oncancel?: () => void;
	};
	let { plan, disciplines, locale, onsaved, oncancel }: Props = $props();

	const initial = untrack(() => plan);
	let nameEn = $state(initial?.nameEn ?? '');
	let nameAr = $state(initial?.nameAr ?? '');
	let sessions = $state<string | number | null>(initial?.sessionsPerWeek ?? 2);
	let price = $state<string | number | null>(initial?.monthlyPrice ?? '');
	let disciplineId = $state(initial?.discipline?.id ?? '');
	let active = $state(initial?.isActive ?? true);
	let errors = $state<FieldErrors>({});
	let failure = $state<string>();
	let busy = $state(false);
	let formElement = $state<HTMLFormElement>();

	const disciplineOptions = $derived([
		{ value: '', label: m.plan_any_discipline() },
		...disciplines.enabled.map((d) => ({ value: d.id, label: localName(d, locale) }))
	]);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		failure = undefined;
		const body = {
			nameEn: nameEn.trim(),
			nameAr: nameAr.trim(),
			sessionsPerWeek: wholeNumber(sessions),
			monthlyPrice: wholeNumber(price),
			disciplineId: disciplineId || null,
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

<form class="sj-stack" bind:this={formElement} onsubmit={submit} novalidate>
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
			label={m.plan_sessions()}
			type="number"
			dir="ltr"
			error={fieldText(errors, 'sessionsPerWeek')}
			bind:value={sessions}
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
		bind:value={disciplineId}
	/>
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
	@media (min-width: 720px) {
		.fields {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
