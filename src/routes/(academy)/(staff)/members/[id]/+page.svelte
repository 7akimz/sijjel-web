<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AffectedBookings from '#lib/components/AffectedBookings.svelte';
	import MemberLevel from '#lib/components/MemberLevel.svelte';
	import MonthPayment from '#lib/components/MonthPayment.svelte';
	import WhatsAppIcon from '#lib/components/WhatsAppIcon.svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { AffectedBooking, BookingView, Member } from '#lib/api/member-types.js';
	import { formatDate, formatMonth } from '#lib/format.js';
	import { inactiveLabel, isLevelledRider, profileChips } from '#lib/forms/member.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, MoreMenu, StatusChip, type MoreMenuItem } from '#lib/ui/index.js';
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
	const SHOWN_BOOKINGS = 2;
	let allBookings = $state(false);
	const shownBookings = $derived(allBookings ? upcoming : upcoming.slice(0, SHOWN_BOOKINGS));
	const chips = $derived(profileChips(member, data.locale));
	const showFee = $derived(data.admin && isRider && data.month !== null);
	// One primary per screen: while the month is unpaid, Mark paid is the primary and Book steps back.
	const owes = $derived(showFee && !member.paidThisMonth);
	const monthName = $derived(data.month ? formatMonth(`${data.month}-01`, data.locale) : '');
	const bookVariant = $derived(owes ? ('secondary' as const) : ('primary' as const));
	let paying = $state(false);

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
		paying = true;
		try {
			await api(`/academy/members/${member.id}/payments/${data.month}`, {
				method: paid ? 'POST' : 'DELETE'
			});
			member = { ...member, paidThisMonth: paid };
			notice = paid
				? m.member_paid_notice({ month: monthName })
				: m.member_unpaid_notice({ month: monthName });
		} catch (e) {
			handle(e);
		} finally {
			paying = false;
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
		...(showFee && member.paidThisMonth && data.month
			? [
					{
						label: m.member_fee_mark_unpaid({ month: monthName }),
						onselect: () => setPaid(false)
					}
				]
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

	<header class="head">
		<div class="who">
			<h1 class="sj-title">{member.displayName}</h1>
			<div class="sj-row">
				{#each chips as chip, i (i)}
					<StatusChip tone={chip.tone}>{chip.text}</StatusChip>
				{/each}
				{#if showFee && member.paidThisMonth}<StatusChip tone="active" dot
						>{m.member_paid_month({ month: monthName })}</StatusChip
					>{/if}
				{#if inactiveLabel(member.status)}<StatusChip tone="stone" dot
						>{inactiveLabel(member.status)}</StatusChip
					>{/if}
			</div>
		</div>
		{#if data.admin}
			<div class="tools">
				{#if member.phone}
					<!-- wa.me is an external WhatsApp address, not a route of this app. -->
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						class="sj-btn sj-btn--secondary sj-btn--icon"
						href="https://wa.me/{member.phone}"
						target="_blank"
						rel="noopener noreferrer"
						aria-label={m.member_whatsapp_to({ name: member.displayName })}
					>
						<WhatsAppIcon />
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{/if}
				<Button
					variant="secondary"
					icon="edit"
					label={m.member_edit()}
					href={resolve('/(academy)/(admin)/members/[id]/edit', { id: member.id })}
				/>
				<MoreMenu label={m.member_more()} items={moreItems} />
			</div>
		{/if}
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

	{#if owes && data.month}
		<MonthPayment
			month={data.month}
			amount={member.plan?.monthlyPrice ?? null}
			currency={data.currency}
			locale={data.locale}
			busy={paying}
			onmarkpaid={() => setPaid(true)}
		/>
	{/if}

	{#if isRider}
		<section class="sj-stack section">
			<div class="section-head">
				<h2 class="sj-heading">{m.member_bookings()}</h2>
				{#if member.status === 'active'}
					<Button
						variant={bookVariant}
						icon="event_available"
						href={resolve('/(academy)/(staff)/members/[id]/book', { id: member.id })}
						>{m.member_book()}</Button
					>
				{/if}
			</div>
			{#if upcoming.length === 0}
				<p class="sj-muted">{m.member_bookings_none()}</p>
			{:else}
				<ul class="sj-list" role="list">
					{#each shownBookings as booking (booking.id)}
						<li class="sj-list__row">
							<div class="sj-list__main">
								<span class="strong"
									>{formatDate(`${booking.date}T00:00:00Z`, data.locale)} ·
									<span dir="ltr">{booking.start}</span></span
								>
								<span class="sj-small sj-muted"
									>{booking.ownHorseName ?? m.booking_school_horse()}</span
								>
							</div>
							<Button variant="quiet" onclick={() => cancelBooking(booking)}
								>{m.booking_cancel()}</Button
							>
						</li>
					{/each}
					{#if !allBookings && upcoming.length > SHOWN_BOOKINGS}
						<li class="sj-list__row more">
							<Button variant="quiet" onclick={() => (allBookings = true)}
								>{m.member_bookings_more({ count: upcoming.length - SHOWN_BOOKINGS })}</Button
							>
						</li>
					{/if}
				</ul>
			{/if}
		</section>
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
</div>

<style>
	.head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-3);
	}
	.who {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		min-width: 0;
	}
	.tools {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-shrink: 0;
	}
	.section {
		gap: var(--space-2);
	}
	.section-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.strong {
		font-weight: 600;
	}
	.more {
		min-block-size: auto;
		padding-block: var(--space-1);
	}
</style>
