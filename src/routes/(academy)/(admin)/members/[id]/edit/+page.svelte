<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import AffectedBookings from '#lib/components/AffectedBookings.svelte';
	import { localName, roleName } from '#lib/academy.js';
	import { api } from '#lib/api/client.js';
	import {
		ApiError,
		errorText,
		fieldText,
		hiddenFieldText,
		type FieldErrors
	} from '#lib/api/errors.js';
	import type { AffectedBooking, Member } from '#lib/api/member-types.js';
	import { focusFirstInvalid } from '#lib/forms/focus.js';
	import {
		isLevelledRider,
		memberErrors,
		memberFormFrom,
		planHint,
		toMemberInput,
		type MemberForm
	} from '#lib/forms/member.js';
	import { plansFor } from '#lib/forms/plans-fit.js';
	import { m } from '#lib/paraglide/messages.js';
	import {
		Banner,
		Button,
		Card,
		CheckboxField,
		SelectField,
		StatusChip,
		TextField
	} from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let member = $state<Member>(untrack(() => data.member));
	let form = $state<MemberForm>(memberFormFrom(untrack(() => data.member)));
	let horseName = $state(untrack(() => data.member.privateHorse?.name ?? ''));
	let horseNotes = $state(untrack(() => data.member.privateHorse?.notes ?? ''));
	let errors = $state<FieldErrors>({});
	let notice = $state<string>();
	let failure = $state<string>();
	let affected = $state<AffectedBooking[]>();
	let busy = $state(false);
	let formElement = $state<HTMLFormElement>();

	const profile = $derived(resolve('/(academy)/(staff)/members/[id]', { id: member.id }));
	const roles = ['rider', 'trainer', 'admin'] as const;
	const isRider = $derived(form.roles.includes('rider'));
	const wasRider = $derived(isLevelledRider(member));
	const ladder = $derived(
		data.disciplines.enabled.find((d) => d.id === form.disciplineId)?.levels ?? []
	);
	const disciplineOptions = $derived(
		data.disciplines.enabled.map((d) => ({ value: d.id, label: localName(d, data.locale) }))
	);
	const levelOptions = $derived(
		ladder.map((l) => ({ value: l.id, label: localName(l, data.locale) }))
	);
	const planOptions = $derived([
		{ value: '', label: '—' },
		...(wasRider
			? plansFor(
					data.plans,
					member.comingMove?.discipline.id ?? member.discipline?.id ?? '',
					member.comingMove?.level.id ?? member.level?.id ?? '',
					member.plan?.id
				)
			: plansFor(data.plans, form.disciplineId, form.levelId)
		).map((p) => ({ value: p.id, label: localName(p, data.locale) }))
	]);
	const planStarts = $derived(
		wasRider ? planHint(form.planId, member, data.today, data.locale) : undefined
	);
	// An existing rider's discipline and level change only through a move, so they have no fields.
	const shownFields = ['roles', 'planId', 'horseSource'];
	const horseOptions = [
		{ value: 'school', label: m.invite_horse_school() },
		{ value: 'own', label: m.invite_horse_own() }
	];

	function clear() {
		notice = failure = undefined;
		affected = undefined;
	}

	function handle(e: unknown) {
		const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
		if (error.code === 'bookings_affected') {
			affected = (error.extra.bookings as AffectedBooking[]) ?? [];
			return;
		}
		errors = error.fields;
		const hidden = wasRider ? hiddenFieldText(error.fields, shownFields) : undefined;
		if (Object.keys(error.fields).length === 0) failure = errorText(error.code);
		else if (hidden) failure = hidden;
		else focusFirstInvalid(formElement);
	}

	function toggleRole(role: (typeof roles)[number], on: boolean) {
		form.roles = on ? [...new Set([...form.roles, role])] : form.roles.filter((r) => r !== role);
	}

	async function save(event: SubmitEvent) {
		event.preventDefault();
		clear();
		errors = memberErrors(form);
		if (Object.keys(errors).length > 0) return focusFirstInvalid(formElement);
		busy = true;
		try {
			await api<Member>(`/academy/members/${member.id}`, {
				method: 'PUT',
				body: toMemberInput(form)
			});
			await goto(profile, { state: { notice: m.member_saved() } });
		} catch (e) {
			handle(e);
		} finally {
			busy = false;
		}
	}

	async function saveHorse() {
		clear();
		try {
			member = await api<Member>(`/academy/members/${member.id}/horse`, {
				method: 'PUT',
				body: { name: horseName.trim(), notes: horseNotes.trim() || null }
			});
			notice = m.member_saved();
		} catch (e) {
			handle(e);
		}
	}

	async function retireHorse() {
		clear();
		try {
			member = await api<Member>(`/academy/members/${member.id}/horse`, { method: 'DELETE' });
		} catch (e) {
			handle(e);
		}
	}
</script>

<svelte:head>
	<title>{m.member_edit_title({ name: member.displayName })}</title>
</svelte:head>

<div class="sj-page">
	<div>
		<Button variant="quiet" icon="arrow_back" href={profile}>{member.displayName}</Button>
	</div>
	<h1 class="sj-title">{m.member_edit_title({ name: member.displayName })}</h1>

	{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
	{#if affected}
		<AffectedBookings
			bookings={affected}
			locale={data.locale}
			oncancel={() => (affected = undefined)}
		/>
	{/if}

	<form class="sj-stack" bind:this={formElement} onsubmit={save} novalidate>
		<Card>
			<fieldset class="sj-stack">
				<legend class="sj-label">{m.member_roles()}</legend>
				{#each roles as role (role)}
					<CheckboxField
						label={roleName(role, data.locale)}
						checked={form.roles.includes(role)}
						onchange={(checked) => toggleRole(role, checked)}
					/>
				{/each}
				{#if fieldText(errors, 'roles')}<span class="sj-field-error"
						>{fieldText(errors, 'roles')}</span
					>{/if}
			</fieldset>
		</Card>
		{#if isRider}
			<Card>
				<h2 class="sj-heading">{m.member_rider_details()}</h2>
				{#if !wasRider}
					<SelectField
						label={m.invite_discipline()}
						options={disciplineOptions}
						error={fieldText(errors, 'disciplineId')}
						bind:value={form.disciplineId}
					/>
					<SelectField
						label={m.invite_level()}
						options={levelOptions}
						error={fieldText(errors, 'levelId')}
						bind:value={form.levelId}
					/>
				{/if}
				<SelectField
					label={m.invite_plan()}
					options={planOptions}
					error={fieldText(errors, 'planId')}
					hint={planStarts}
					bind:value={form.planId}
				/>
				<SelectField
					label={m.invite_horse()}
					options={horseOptions}
					bind:value={form.horseSource as string}
				/>
			</Card>
		{/if}
		<div class="sj-row">
			<Button type="submit" disabled={busy}>{m.action_save()}</Button>
			<Button variant="quiet" href={profile}>{m.action_cancel()}</Button>
		</div>
	</form>

	{#if member.roles.includes('rider') && member.horseSource === 'own'}
		<Card>
			<h2 class="sj-heading">{m.member_horse_title()}</h2>
			{#if member.privateHorse && !member.privateHorse.isActive}
				<StatusChip tone="stone">{m.member_horse_retired()}</StatusChip>
			{:else if !member.privateHorse}
				<p class="sj-muted">{m.member_horse_none()}</p>
			{/if}
			<TextField label={m.member_horse_name()} bind:value={horseName} />
			<TextField label={m.member_horse_notes()} bind:value={horseNotes} />
			<div class="sj-row">
				<Button variant="secondary" onclick={saveHorse}>{m.member_horse_save()}</Button>
				{#if member.privateHorse?.isActive}
					<Button variant="quiet" onclick={retireHorse}>{m.member_horse_retire()}</Button>
				{/if}
			</div>
		</Card>
	{/if}
</div>

<style>
	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
	}
</style>
