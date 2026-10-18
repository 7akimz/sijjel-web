<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { localName } from '#lib/academy.js';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { BookingView, PlanSummary } from '#lib/api/member-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { formatDate } from '#lib/format.js';
	import {
		bookingErrorText,
		dayName,
		riderBlockReason,
		riderBlockText
	} from '#lib/forms/booking.js';
	import { formatMoney } from '#lib/money.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Card, ProgressBar, SessionSlot, StatusChip } from '#lib/ui/index.js';

	type Props = { summary: PlanSummary; bookings: BookingView[]; locale: Locale };
	let { summary, bookings: initial, locale }: Props = $props();

	let bookings = $state(untrack(() => initial));
	let notice = $state('');
	let failure = $state('');
	let usedThisWeek = $state(untrack(() => summary.usedThisWeek));

	$effect(() => {
		bookings = initial;
		usedThisWeek = summary.usedThisWeek;
	});

	const blocked = $derived(riderBlockReason(summary));
	const left = $derived(Math.max(summary.sessionsPerWeek - usedThisWeek, 0));
	const now = Date.now();
	const upcoming = $derived(
		bookings.filter(
			(b) =>
				Date.parse(b.startsAt) > now &&
				(b.status === 'active' || (b.status === 'cancelled' && b.cancelledByAcademy))
		)
	);
	const when = (b: BookingView) =>
		`${dayName(b.date, locale)} · ${formatDate(`${b.date}T00:00:00Z`, locale)}`;

	async function cancel(booking: BookingView) {
		notice = '';
		failure = '';
		try {
			const cancelled = await api<BookingView>(`/bookings/${booking.id}/cancel`, {
				method: 'POST'
			});
			bookings = bookings.map((b) => (b.id === cancelled.id ? cancelled : b));
			if (booking.date >= summary.weekStart && booking.date <= summary.weekEnd) usedThisWeek -= 1;
			notice = m.booking_cancel_done();
		} catch (e) {
			failure = e instanceof ApiError ? bookingErrorText(e, locale) : errorText('internal_error');
		}
	}
</script>

{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}
{#if failure}<Banner icon="error" tone="danger">{failure}</Banner>{/if}

<Card>
	<div class="sj-stack">
		<h2 class="sj-heading">{m.rider_plan_title()}</h2>
		{#if summary.plan}
			<div class="plan">
				<strong>{localName(summary.plan, locale)}</strong>
				<span class="sj-muted"
					>{m.rider_plan_price({
						price: formatMoney(summary.plan.monthlyPrice, summary.currency, locale)
					})}</span
				>
			</div>
			<ProgressBar
				value={left}
				max={summary.sessionsPerWeek}
				label={m.rider_plan_left({ left, perWeek: summary.sessionsPerWeek })}
			/>
			<p class="sj-small">{m.rider_plan_left({ left, perWeek: summary.sessionsPerWeek })}</p>
			{#if summary.paidThisMonth}
				<StatusChip tone="active" dot>{m.rider_plan_paid()}</StatusChip>
			{:else if summary.unpaidBooking === 'allow'}
				<StatusChip tone="stone" dot>{m.rider_plan_unpaid()}</StatusChip>
			{/if}
		{/if}
		{#if blocked}
			<Banner icon="info" tone="pending">{riderBlockText(blocked, locale)}</Banner>
		{:else}
			<Button href={resolve('/(academy)/(rider)/book')} icon="event_available"
				>{m.rider_book_action()}</Button
			>
		{/if}
	</div>
</Card>

<Card>
	<div class="sj-stack">
		<h2 class="sj-heading">{m.member_bookings()}</h2>
		{#if upcoming.length === 0}
			<p class="sj-muted">{m.member_bookings_none()}</p>
		{/if}
		{#each upcoming as booking (booking.id)}
			<SessionSlot
				start={booking.start}
				end={booking.end}
				endLabel={m.book_end({ time: booking.end })}
				placesLeft={0}
				capacity={0}
				horsesFree={0}
				horsesTotal={0}
				state={booking.status === 'active' ? 'booked' : 'full'}
				placesLabel={when(booking)}
				note={booking.status === 'cancelled'
					? m.booking_cancelled_by_academy()
					: (booking.ownHorseName ?? m.booking_school_horse())}
			>
				{#snippet action()}
					{#if booking.status === 'active'}
						{#if booking.canCancel}
							<Button variant="quiet" onclick={() => cancel(booking)}>{m.booking_cancel()}</Button>
						{:else}
							<span class="sj-small sj-muted">{m.rider_cancel_ask()}</span>
						{/if}
					{/if}
				{/snippet}
			</SessionSlot>
		{/each}
	</div>
</Card>

<style>
	.plan {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-2);
	}
	p {
		margin: 0;
	}
</style>
