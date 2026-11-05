<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { localName } from '#lib/academy.js';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, fieldText, type FieldErrors } from '#lib/api/errors.js';
	import type { AcademyDisciplines } from '#lib/api/academy-types.js';
	import type { CreatedAcademyInvite, Plan } from '#lib/api/member-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { focusFirstInvalid } from '#lib/forms/focus.js';
	import {
		inviteMemberErrors,
		toInviteRequest,
		type InviteMemberForm
	} from '#lib/forms/invite-member.js';
	import { disciplineHasPlan, plansFor } from '#lib/forms/plans-fit.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, SelectField, TextField } from '#lib/ui/index.js';

	type Props = {
		/** Riders are invited from Riders, admins and trainers from Settings, Staff. */
		kind: 'rider' | 'staff';
		disciplines: AcademyDisciplines;
		plans: Plan[];
		locale: Locale;
		ridersAllowed: boolean;
		/** The academy's package has no rider place left. */
		riderLimitReached?: boolean;
		oncreated: (invite: CreatedAcademyInvite, form: InviteMemberForm) => void;
	};
	let {
		kind,
		disciplines,
		plans,
		locale,
		ridersAllowed,
		riderLimitReached = false,
		oncreated
	}: Props = $props();

	const riderBlock = $derived(
		kind !== 'rider'
			? undefined
			: !ridersAllowed
				? m.invite_riders_after_setup()
				: riderLimitReached
					? m.subscription_rider_limit()
					: undefined
	);

	const first = untrack(
		() => disciplines.enabled.find((d) => disciplineHasPlan(plans, d.id)) ?? disciplines.enabled[0]
	);
	let form = $state<InviteMemberForm>({
		role: untrack(() => (kind === 'rider' ? 'rider' : 'trainer')),
		name: '',
		phone: '',
		disciplineId: first?.id ?? '',
		levelId: first?.levels[0]?.id ?? '',
		planId: '',
		horseSource: 'school'
	});
	let errors = $state<FieldErrors>({});
	let failure = $state<string>();
	let busy = $state(false);
	let formElement = $state<HTMLFormElement>();

	const roleOptions = [
		{ value: 'trainer', label: m.invite_role_trainer_option() },
		{ value: 'admin', label: m.invite_role_admin_option() }
	];
	const horseOptions = [
		{ value: 'school', label: m.invite_horse_school() },
		{ value: 'own', label: m.invite_horse_own() }
	];
	const disciplineOptions = $derived(
		disciplines.enabled.map((d) =>
			disciplineHasPlan(plans, d.id)
				? { value: d.id, label: localName(d, locale) }
				: { value: d.id, label: m.invite_discipline_no_plan({ name: localName(d, locale) }) }
		)
	);
	const chosenDiscipline = $derived(disciplines.enabled.find((d) => d.id === form.disciplineId));
	const chosenLevel = $derived(chosenDiscipline?.levels.find((l) => l.id === form.levelId));
	const addPlanQuery = $derived(
		new URLSearchParams(
			plans.length > 0 && chosenDiscipline
				? { from: 'invite', discipline: chosenDiscipline.id }
				: { from: 'invite' }
		).toString()
	);
	const levelOptions = $derived(
		(disciplines.enabled.find((d) => d.id === form.disciplineId)?.levels ?? []).map((l) => ({
			value: l.id,
			label: localName(l, locale)
		}))
	);
	const fitting = $derived(plansFor(plans, form.disciplineId, form.levelId));
	const planOptions = $derived([
		{ value: '', label: '—' },
		...fitting.map((p) => ({ value: p.id, label: localName(p, locale) }))
	]);

	$effect(() => {
		if (form.planId && !fitting.some((p) => p.id === form.planId)) form.planId = '';
	});

	let shownDiscipline = untrack(() => form.disciplineId);
	$effect(() => {
		if (form.disciplineId === shownDiscipline) return;
		shownDiscipline = form.disciplineId;
		form.levelId = disciplines.enabled.find((d) => d.id === form.disciplineId)?.levels[0]?.id ?? '';
	});

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		failure = undefined;
		errors = inviteMemberErrors(form);
		if (Object.keys(errors).length > 0) return focusFirstInvalid(formElement);
		busy = true;
		try {
			const created = await api<CreatedAcademyInvite>('/academy/invites', {
				method: 'POST',
				body: toInviteRequest(form)
			});
			oncreated(created, { ...form });
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

{#if riderBlock}
	<Banner tone="pending" icon="info">{riderBlock}</Banner>
{:else}
	<form method="post" class="sj-stack" bind:this={formElement} onsubmit={submit} novalidate>
		{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
		{#if kind === 'staff'}
			<SelectField label={m.invite_role()} options={roleOptions} bind:value={form.role as string} />
		{/if}
		<TextField
			label={m.invite_name()}
			autocomplete="off"
			error={fieldText(errors, 'name')}
			required
			bind:value={form.name}
		/>
		<TextField
			label={m.invite_phone()}
			type="text"
			dir="ltr"
			hint={m.invite_phone_hint()}
			error={fieldText(errors, 'phone')}
			bind:value={form.phone}
		/>
		{#if form.role === 'rider'}
			{#if plans.length === 0}
				<Banner tone="pending" icon="info">
					{m.invite_no_plans()}
					<a href={resolve(`/(academy)/(admin)/settings/plans?${addPlanQuery}`)}
						>{m.invite_add_plan()}</a
					>
				</Banner>
			{/if}
			<SelectField
				label={m.invite_discipline()}
				options={disciplineOptions}
				error={fieldText(errors, 'disciplineId')}
				bind:value={form.disciplineId}
			/>
			<SelectField
				label={m.invite_level()}
				options={levelOptions}
				error={fieldText(errors, 'levelId') ?? undefined}
				bind:value={form.levelId}
			/>
			<p class="sj-small sj-muted">{m.invite_level_hint()}</p>
			<SelectField
				label={m.invite_plan()}
				options={planOptions}
				error={fieldText(errors, 'planId')}
				bind:value={form.planId}
			/>
			{#if plans.length > 0 && fitting.length === 0 && chosenDiscipline}
				<p class="sj-small">
					{chosenLevel && disciplineHasPlan(plans, chosenDiscipline.id)
						? m.invite_level_no_plan({
								discipline: localName(chosenDiscipline, locale),
								level: localName(chosenLevel, locale)
							})
						: m.invite_discipline_has_no_plan({ discipline: localName(chosenDiscipline, locale) })}
					<a href={resolve(`/(academy)/(admin)/settings/plans?${addPlanQuery}`)}
						>{m.invite_add_plan()}</a
					>
				</p>
			{/if}
			<SelectField
				label={m.invite_horse()}
				options={horseOptions}
				bind:value={form.horseSource as string}
			/>
		{/if}
		<div>
			<Button type="submit" icon="send" disabled={busy}>{m.invite_create()}</Button>
		</div>
	</form>
{/if}
