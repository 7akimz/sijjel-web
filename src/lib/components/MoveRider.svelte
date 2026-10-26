<script lang="ts">
	import { untrack } from 'svelte';
	import { localName } from '#lib/academy.js';
	import type { AcademyDisciplines } from '#lib/api/academy-types.js';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, fieldText, type FieldErrors } from '#lib/api/errors.js';
	import type { Member, MoveInput, Plan } from '#lib/api/member-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { formatDate, formatMonth } from '#lib/format.js';
	import { firstOfNextMonth } from '#lib/forms/month.js';
	import { planFits, plansFor } from '#lib/forms/plans-fit.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, SelectField } from '#lib/ui/index.js';

	type Props = {
		member: Member;
		disciplines: AcademyDisciplines;
		plans: Plan[];
		today: string;
		locale: Locale;
		target?: { disciplineId: string; levelId: string };
		onmoved: (member: Member) => void;
		oncancel: () => void;
	};
	let { member, disciplines, plans, today, locale, target, onmoved, oncancel }: Props = $props();

	let disciplineId = $state(untrack(() => target?.disciplineId ?? member.discipline?.id ?? ''));
	let levelId = $state(untrack(() => target?.levelId ?? ''));
	let start = $state<MoveInput['start']>('next_month');
	let planId = $state('');
	let errors = $state<FieldErrors>({});
	let failure = $state('');
	let busy = $state(false);

	const first = $derived(firstOfNextMonth(today));
	const ladder = $derived(disciplines.enabled.find((d) => d.id === disciplineId)?.levels ?? []);
	const targetLevel = $derived(ladder.find((l) => l.id === levelId));
	// The plan the rider has after the move: the coming one, or else the current one. Embedded
	// plans carry no levels, so the full plan comes from the academy's list.
	const planAfter = $derived(
		plans.find((p) => p.id === (member.comingPlan?.plan.id ?? member.plan?.id))
	);
	const needsPlan = $derived(
		levelId !== '' && !(planAfter && planFits(planAfter, disciplineId, levelId))
	);
	const disciplineOptions = $derived(
		disciplines.enabled.map((d) => ({ value: d.id, label: localName(d, locale) }))
	);
	const levelOptions = $derived([
		{ value: '', label: '—' },
		...ladder.map((l) => ({ value: l.id, label: localName(l, locale) }))
	]);
	const fitting = $derived(plansFor(plans, disciplineId, levelId));
	const planOptions = $derived([
		{ value: '', label: '—' },
		...fitting.map((p) => ({ value: p.id, label: localName(p, locale) }))
	]);

	$effect(() => {
		if (planId && !fitting.some((p) => p.id === planId)) planId = '';
	});

	function chooseDiscipline(id: string) {
		disciplineId = id;
		levelId = '';
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		failure = '';
		errors = {};
		if (!levelId) errors = { levelId: ['level_required'] };
		else if (needsPlan && !planId) errors = { planId: ['plan_required'] };
		if (Object.keys(errors).length > 0) return;
		busy = true;
		try {
			const body: MoveInput = { disciplineId, levelId, start };
			if (needsPlan) body.planId = planId;
			onmoved(await api<Member>(`/academy/members/${member.id}/move`, { method: 'POST', body }));
		} catch (e) {
			const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
			errors = error.fields;
			if (Object.keys(error.fields).length === 0) failure = errorText(error.code, locale);
		} finally {
			busy = false;
		}
	}
</script>

<form class="sj-stack" onsubmit={submit} novalidate>
	{#if target && targetLevel}
		<h3 class="sj-label">
			{m.member_move_to({ level: localName(targetLevel, locale) }, { locale })}
		</h3>
	{:else}
		<h3 class="sj-label">{m.member_change_level({}, { locale })}</h3>
		<SelectField
			label={m.invite_discipline({}, { locale })}
			options={disciplineOptions}
			error={fieldText(errors, 'disciplineId')}
			bind:value={() => disciplineId, chooseDiscipline}
		/>
		<SelectField
			label={m.invite_level({}, { locale })}
			options={levelOptions}
			error={fieldText(errors, 'levelId')}
			bind:value={levelId}
		/>
	{/if}
	<fieldset class="sj-stack">
		<legend class="sj-label">{m.member_move_start({}, { locale })}</legend>
		<label class="choice">
			<input type="radio" name="start" value="next_month" bind:group={start} />
			{m.member_move_from_first({ month: formatMonth(first, locale) }, { locale })}
		</label>
		<label class="choice">
			<input type="radio" name="start" value="today" bind:group={start} />
			{m.member_move_from_today({}, { locale })}
		</label>
		{#if fieldText(errors, 'start')}<span class="sj-field-error">{fieldText(errors, 'start')}</span
			>{/if}
	</fieldset>
	{#if needsPlan || fieldText(errors, 'planId')}
		<SelectField
			label={m.invite_plan({}, { locale })}
			options={planOptions}
			error={fieldText(errors, 'planId')}
			hint={m.member_plan_from({ date: formatDate(first, locale) }, { locale })}
			bind:value={planId}
		/>
	{/if}
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
	<div class="sj-row">
		<Button type="submit" disabled={busy}>{m.member_move_save({}, { locale })}</Button>
		<Button variant="quiet" onclick={oncancel}>{m.action_cancel({}, { locale })}</Button>
	</div>
</form>

<style>
	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
	}
	h3 {
		margin: 0;
	}
	.choice {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		background: var(--surface);
		border: 1px solid var(--line);
		cursor: pointer;
	}
	.choice:has(input:checked) {
		border-color: var(--accent);
		box-shadow: inset 0 0 0 1px var(--accent);
	}
</style>
