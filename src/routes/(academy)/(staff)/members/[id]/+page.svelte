<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import AffectedBookings from '#lib/components/AffectedBookings.svelte';
	import MemberLevel from '#lib/components/MemberLevel.svelte';
	import { localName, roleName } from '#lib/academy.js';
	import { api } from '#lib/api/client.js';
	import {
		ApiError,
		errorText,
		fieldText,
		hiddenFieldText,
		type FieldErrors
	} from '#lib/api/errors.js';
	import type { AffectedBooking, BookingView, Member } from '#lib/api/member-types.js';
	import { formatDate } from '#lib/format.js';
	import { focusFirstInvalid } from '#lib/forms/focus.js';
	import {
		memberErrors,
		formAfterMove,
		isLevelledRider,
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
	let bookings = $state<BookingView[]>(untrack(() => data.bookings));
	let form = $state<MemberForm>(memberFormFrom(untrack(() => data.member)));
	let horseName = $state(untrack(() => data.member.privateHorse?.name ?? ''));
	let horseNotes = $state(untrack(() => data.member.privateHorse?.notes ?? ''));
	let errors = $state<FieldErrors>({});
	let notice = $state<string>();
	let failure = $state<string>();
	let affected = $state<{ bookings: AffectedBooking[]; retry?: () => void }>();
	let busy = $state(false);
	let formElement = $state<HTMLFormElement>();

	const roles = ['rider', 'trainer', 'admin'] as const;
	const isRider = $derived(form.roles.includes('rider'));
	const wasRider = $derived(isLevelledRider(member));
	const ladder = $derived(
		data.disciplines.enabled.find((d) => d.id === form.disciplineId)?.levels ?? []
	);
	const disciplineOptions = $derived(
		data.disciplines.enabled.map((d) => ({
			value: d.id,
			label: localName(d, data.locale)
		}))
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
	const shownFields = ['displayName', 'phone', 'roles', 'age', 'weightKg', 'planId', 'horseSource'];
	const horseOptions = [
		{ value: 'school', label: m.invite_horse_school() },
		{ value: 'own', label: m.invite_horse_own() }
	];
	const upcoming = $derived(bookings.filter((b) => b.status === 'active' && b.canCancel));

	function clear() {
		notice = failure = undefined;
		affected = undefined;
	}

	function handle(e: unknown, retry?: () => void) {
		const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
		if (error.code === 'bookings_affected') {
			affected = { bookings: (error.extra.bookings as AffectedBooking[]) ?? [], retry };
			return;
		}
		errors = error.fields;
		const hidden = wasRider ? hiddenFieldText(error.fields, shownFields) : undefined;
		if (Object.keys(error.fields).length === 0) failure = errorText(error.code);
		else if (hidden) failure = hidden;
		else focusFirstInvalid(formElement);
	}

	// A move changes the rider's level and plan, so the profile form follows it and a later save
	// never sends the old level back.
	function levelChanged(updated: Member) {
		form = formAfterMove(form, member, updated);
		member = updated;
		errors = {};
	}

	function toggleRole(role: (typeof roles)[number], on: boolean) {
		form.roles = on ? [...new Set([...form.roles, role])] : form.roles.filter((r) => r !== role);
	}

	async function save(event: SubmitEvent) {
		event.preventDefault();
		clear();
		if (!data.rules) return;
		errors = memberErrors(form, data.rules);
		if (Object.keys(errors).length > 0) return focusFirstInvalid(formElement);
		busy = true;
		try {
			member = await api<Member>(`/academy/members/${member.id}`, {
				method: 'PUT',
				body: toMemberInput(form)
			});
			form = memberFormFrom(member);
			notice = m.member_saved();
		} catch (e) {
			handle(e);
		} finally {
			busy = false;
		}
	}

	async function setPaid(paid: boolean) {
		clear();
		if (!data.month) return;
		try {
			await api(`/academy/members/${member.id}/payments/${data.month}`, {
				method: paid ? 'POST' : 'DELETE'
			});
			member = { ...member, paidThisMonth: paid };
		} catch (e) {
			handle(e);
		}
	}

	async function saveHorse() {
		clear();
		try {
			member = await api<Member>(`/academy/members/${member.id}/horse`, {
				method: 'PUT',
				body: { name: horseName.trim(), notes: horseNotes.trim() || null }
			});
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

	async function suspend(confirm = false) {
		clear();
		try {
			member = await api<Member>(`/academy/members/${member.id}/suspend`, {
				method: 'POST',
				body: { confirm }
			});
			notice = m.member_suspended_notice();
			bookings = await api<BookingView[]>(`/academy/members/${member.id}/bookings`);
		} catch (e) {
			handle(e, () => suspend(true));
		}
	}

	async function reactivate() {
		clear();
		try {
			member = await api<Member>(`/academy/members/${member.id}/reactivate`, { method: 'POST' });
			notice = m.member_reactivated();
		} catch (e) {
			handle(e);
		}
	}

	async function cancelBooking(booking: BookingView) {
		clear();
		try {
			const cancelled = await api<BookingView>(`/bookings/${booking.id}/cancel`, {
				method: 'POST'
			});
			bookings = bookings.map((b) => (b.id === cancelled.id ? cancelled : b));
			notice = m.booking_cancel_done();
		} catch (e) {
			handle(e);
		}
	}
</script>

<svelte:head>
	<title>{member.displayName}</title>
</svelte:head>

<div class="sj-page">
	<div>
		<Button variant="quiet" icon="arrow_back" href={resolve('/(academy)/(staff)/members')}>
			{m.back_to_members()}
		</Button>
	</div>
	<div class="sj-page-head">
		<div class="sj-row">
			<h1 class="sj-title">{member.displayName}</h1>
			{#if member.status === 'suspended'}<StatusChip tone="stone">{m.member_suspended()}</StatusChip
				>{/if}
		</div>
		{#if member.roles.includes('rider') && member.status === 'active'}
			<Button
				icon="event_available"
				href={resolve('/(academy)/(staff)/members/[id]/book', { id: member.id })}
			>
				{m.member_book_for()}
			</Button>
		{/if}
	</div>

	{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
	{#if affected}
		<AffectedBookings
			bookings={affected.bookings}
			locale={data.locale}
			confirmLabel={affected.retry ? m.member_suspend_confirm() : undefined}
			onconfirm={affected.retry}
			oncancel={() => (affected = undefined)}
		/>
	{/if}

	{#if data.admin && data.rules}
		<form class="sj-stack" bind:this={formElement} onsubmit={save} novalidate>
			<Card>
				<h2 class="sj-heading">{m.member_details()}</h2>
				<TextField
					label={m.member_name()}
					error={fieldText(errors, 'displayName')}
					bind:value={form.displayName}
				/>
				<p class="sj-small sj-muted" dir="ltr">{member.email}</p>
				<TextField
					label={m.member_phone()}
					dir="ltr"
					error={fieldText(errors, 'phone')}
					bind:value={form.phone}
				/>
				{#if member.phone}
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						class="sj-btn sj-btn--quiet wa"
						href="https://wa.me/{member.phone}"
						target="_blank"
						rel="noopener noreferrer"
					>
						{m.member_whatsapp()}
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{/if}
				<fieldset class="sj-stack roles">
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
					<div class="pair">
						<TextField
							label={m.invite_age()}
							type="number"
							dir="ltr"
							error={fieldText(errors, 'age')}
							bind:value={form.age}
						/>
						<TextField
							label={data.rules.maxRiderWeightKg ? m.invite_weight() : m.invite_weight_optional()}
							type="number"
							dir="ltr"
							error={fieldText(errors, 'weightKg')}
							bind:value={form.weightKg}
						/>
					</div>
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
			<div><Button type="submit" disabled={busy}>{m.action_save()}</Button></div>
		</form>

		{#if member.roles.includes('rider')}
			<Card>
				<h2 class="sj-heading">{m.member_payments()}</h2>
				<div class="sj-row">
					<span>{m.member_this_month()}</span>
					{#if member.paidThisMonth}
						<StatusChip tone="active" dot>{m.member_paid_chip()}</StatusChip>
						<Button variant="quiet" onclick={() => setPaid(false)}>{m.member_mark_unpaid()}</Button>
					{:else}
						<StatusChip tone="danger" dot>{m.member_unpaid_chip()}</StatusChip>
						<Button variant="secondary" icon="check" onclick={() => setPaid(true)}
							>{m.member_mark_paid()}</Button
						>
					{/if}
				</div>
			</Card>

			{#if member.horseSource === 'own'}
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
		{/if}

		<Card>
			<h2 class="sj-heading">{m.member_status()}</h2>
			<div>
				{#if member.status === 'active'}
					<Button variant="danger" onclick={() => suspend()}>{m.member_suspend()}</Button>
				{:else}
					<Button variant="secondary" onclick={reactivate}>{m.member_reactivate()}</Button>
				{/if}
			</div>
		</Card>
	{:else}
		<Card>
			<h2 class="sj-heading">{m.member_details()}</h2>
			<div class="sj-row">
				{#each member.roles as role (role)}<StatusChip tone="active"
						>{roleName(role, data.locale)}</StatusChip
					>{/each}
				{#if member.discipline && member.level}
					<StatusChip tone="level"
						>{localName(member.discipline, data.locale)} · {localName(
							member.level,
							data.locale
						)}</StatusChip
					>
				{/if}
				{#if member.plan}<StatusChip tone="neutral"
						>{localName(member.plan, data.locale)}</StatusChip
					>{/if}
			</div>
		</Card>
	{/if}

	{#if wasRider}
		<MemberLevel
			{member}
			disciplines={data.disciplines}
			plans={data.plans}
			today={data.today}
			locale={data.locale}
			onchange={levelChanged}
		/>
	{/if}

	{#if member.roles.includes('rider')}
		<Card>
			<h2 class="sj-heading">{m.member_bookings()}</h2>
			{#if upcoming.length === 0}
				<p class="sj-muted">{m.member_bookings_none()}</p>
			{:else}
				<ul class="bookings" role="list">
					{#each upcoming as booking (booking.id)}
						<li>
							<span
								>{formatDate(`${booking.date}T00:00:00Z`, data.locale)}
								<span dir="ltr">{booking.start}</span></span
							>
							<span class="sj-small sj-muted"
								>{booking.ownHorseName ?? m.booking_school_horse()}</span
							>
							<Button variant="quiet" onclick={() => cancelBooking(booking)}
								>{m.booking_cancel()}</Button
							>
						</li>
					{/each}
				</ul>
			{/if}
		</Card>
	{/if}
</div>

<style>
	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
	}
	.pair {
		display: grid;
		gap: var(--space-3);
	}
	@media (min-width: 720px) {
		.pair {
			grid-template-columns: 1fr 1fr;
		}
	}
	.wa {
		align-self: flex-start;
	}
	.bookings {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.bookings li {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-3);
		padding-block: var(--space-2);
	}
	.bookings li + li {
		border-block-start: 1px solid var(--line);
	}
	.bookings li > span:first-child {
		flex: 1;
		font-weight: 600;
	}
</style>
