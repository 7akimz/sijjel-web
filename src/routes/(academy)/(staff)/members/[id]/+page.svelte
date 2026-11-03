<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AffectedBookings from '#lib/components/AffectedBookings.svelte';
	import MemberLevel from '#lib/components/MemberLevel.svelte';
	import WhatsAppIcon from '#lib/components/WhatsAppIcon.svelte';
	import { localName, roleName } from '#lib/academy.js';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { AffectedBooking, BookingView, Member } from '#lib/api/member-types.js';
	import { formatDate } from '#lib/format.js';
	import { inactiveLabel, isLevelledRider } from '#lib/forms/member.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Card, MoreMenu, StatusChip, type MoreMenuItem } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let member = $state<Member>(untrack(() => data.member));
	let bookings = $state<BookingView[]>(untrack(() => data.bookings));
	let notice = $state<string | undefined>(untrack(() => page.state.notice));
	let failure = $state<string>();
	let affected = $state<{ bookings: AffectedBooking[]; retry?: () => void }>();

	const isRider = $derived(member.roles.includes('rider'));
	const wasRider = $derived(isLevelledRider(member));
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
		failure = errorText(error.code);
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

	// Suspending and marking as left stop the member the same way; only the status differs.
	const deactivations = {
		suspend: { confirm: m.member_suspend_confirm, done: m.member_suspended_notice },
		leave: { confirm: m.member_left_confirm, done: m.member_left_notice }
	};
	let deactivating = $state<keyof typeof deactivations>('suspend');

	async function deactivate(action: keyof typeof deactivations, confirm = false) {
		clear();
		deactivating = action;
		try {
			member = await api<Member>(`/academy/members/${member.id}/${action}`, {
				method: 'POST',
				body: { confirm }
			});
			notice = deactivations[action].done();
			bookings = await api<BookingView[]>(`/academy/members/${member.id}/bookings`);
		} catch (e) {
			handle(e, () => deactivate(action, true));
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

	const moreItems = $derived<MoreMenuItem[]>([
		...(isRider && member.paidThisMonth
			? [{ label: m.member_mark_unpaid(), onselect: () => setPaid(false) }]
			: []),
		...(member.status === 'active'
			? [
					{ label: m.member_mark_left(), onselect: () => deactivate('leave') },
					{ label: m.member_suspend(), onselect: () => deactivate('suspend'), danger: true }
				]
			: [{ label: m.member_reactivate(), onselect: reactivate }])
	]);
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

	<header class="sj-stack head">
		<div class="sj-row">
			<h1 class="sj-title">{member.displayName}</h1>
			{#if inactiveLabel(member.status)}<StatusChip tone="stone"
					>{inactiveLabel(member.status)}</StatusChip
				>{/if}
		</div>
		<div class="sj-row chips">
			{#each member.roles as role (role)}
				<StatusChip tone="active">{roleName(role, data.locale)}</StatusChip>
			{/each}
			{#if member.discipline && member.level}
				<StatusChip tone="level"
					>{localName(member.discipline, data.locale)} · {localName(
						member.level,
						data.locale
					)}</StatusChip
				>
			{/if}
			{#if member.plan}
				<StatusChip tone="neutral">{localName(member.plan, data.locale)}</StatusChip>
			{/if}
			{#if data.admin && isRider}
				{#if member.paidThisMonth}
					<StatusChip tone="active" dot>{m.member_paid_chip()}</StatusChip>
				{:else}
					<StatusChip tone="danger" dot>{m.member_unpaid_chip()}</StatusChip>
				{/if}
			{/if}
		</div>
		<div class="sj-row actions">
			{#if data.admin && isRider && !member.paidThisMonth}
				<Button variant="secondary" icon="check" onclick={() => setPaid(true)}
					>{m.member_mark_paid()}</Button
				>
			{/if}
			{#if isRider && member.status === 'active'}
				<Button
					icon="event_available"
					href={resolve('/(academy)/(staff)/members/[id]/book', { id: member.id })}
				>
					{m.member_book_for()}
				</Button>
			{/if}
			{#if data.admin}
				<Button
					variant="secondary"
					icon="edit"
					href={resolve('/(academy)/(admin)/members/[id]/edit', { id: member.id })}
					>{m.member_edit()}</Button
				>
				{#if member.phone}
					<!-- wa.me is an external WhatsApp address, not a route of this app. -->
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						class="sj-btn sj-btn--quiet sj-btn--icon"
						href="https://wa.me/{member.phone}"
						target="_blank"
						rel="noopener noreferrer"
						aria-label={m.member_whatsapp_to({ name: member.displayName })}
					>
						<WhatsAppIcon />
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{/if}
				<MoreMenu label={m.member_more()} items={moreItems} />
			{/if}
		</div>
	</header>

	{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
	{#if affected}
		<AffectedBookings
			bookings={affected.bookings}
			locale={data.locale}
			confirmLabel={affected.retry ? deactivations[deactivating].confirm() : undefined}
			onconfirm={affected.retry}
			oncancel={() => (affected = undefined)}
		/>
	{/if}

	{#if wasRider}
		<MemberLevel
			{member}
			disciplines={data.disciplines}
			plans={data.plans}
			today={data.today}
			locale={data.locale}
			onchange={(updated) => (member = updated)}
		/>
	{/if}

	{#if isRider}
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

	{#if data.admin && isRider && member.horseSource === 'own'}
		<Card>
			<h2 class="sj-heading">{m.member_horse_title()}</h2>
			{#if member.privateHorse}
				<div class="sj-row">
					<span class="horse">{member.privateHorse.name}</span>
					{#if !member.privateHorse.isActive}<StatusChip tone="stone"
							>{m.member_horse_retired()}</StatusChip
						>{/if}
				</div>
				{#if member.privateHorse.notes}<p class="sj-muted">{member.privateHorse.notes}</p>{/if}
			{:else}
				<p class="sj-muted">{m.member_horse_none()}</p>
			{/if}
		</Card>
	{/if}

	{#if data.admin && (member.phone || member.email)}
		<Card>
			<h2 class="sj-heading">{m.member_contact()}</h2>
			{#if member.phone}<p dir="ltr" class="contact">{member.phone}</p>{/if}
			{#if member.email}<p dir="ltr" class="contact">{member.email}</p>{/if}
			<span class="sj-small sj-muted">{m.member_phone_hint()}</span>
		</Card>
	{/if}
</div>

<style>
	.head {
		gap: var(--space-3);
	}
	.chips,
	.actions {
		flex-wrap: wrap;
	}
	.contact {
		margin: 0;
		text-align: start;
	}
	.horse {
		font-weight: 600;
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
