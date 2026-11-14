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
	import NotifyOffer from '#lib/components/NotifyOffer.svelte';
	import type { Device } from '#lib/push/device.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Card, ProgressBar, SessionSlot, StatusChip } from '#lib/ui/index.js';

	type Props = {
		summary: PlanSummary;
		bookings: BookingView[];
		locale: Locale;
		publicKey?: string | null;
		device?: Device;
	};
	let { summary, bookings: initial, locale, publicKey = null, device }: Props = $props();

	let bookings = $state(untrack(() => initial));
	let notice = $state('');
	let failure = $state('');
	let usedThisMonth = $state(untrack(() => summary.usedThisMonth));

	$effect(() => {
		bookings = initial;
		usedThisMonth = summary.usedThisMonth;
	});

	const blocked = $derived(riderBlockReason(summary));
	const left = $derived(Math.max(summary.lessonsPerMonth - usedThisMonth, 0));
	const now = Date.now();
	const upcoming = $derived(
		bookings.filter(
			(b) =>
				Date.parse(b.startsAt) > now &&
				(b.status === 'active' || (b.status === 'cancelled' && b.cancelledByAcademy))
		)
	);
	const past = $derived(
		bookings
			.filter((b) => Date.parse(b.startsAt) <= now)
			.sort((a, b) => b.startsAt.localeCompare(a.startsAt))
	);
	// Notifications are offered once, under the first session the academy cancelled, when the
	// reason to want them is right there.
	const firstCancelled = $derived(upcoming.find((b) => b.status === 'cancelled')?.id);
	const pastId = $props.id();
	const when = (b: BookingView) =>
		`${dayName(b.date, locale)} · ${formatDate(`${b.date}T00:00:00Z`, locale)}`;

	const academyCancelText = (b: BookingView) =>
		b.cancelReason
			? m.booking_cancelled_reason({ reason: b.cancelReason })
			: m.booking_cancelled_by_academy();

	async function cancel(booking: BookingView) {
		notice = '';
		failure = '';
		try {
			const cancelled = await api<BookingView>(`/bookings/${booking.id}/cancel`, {
				method: 'POST'
			});
			bookings = bookings.map((b) => (b.id === cancelled.id ? cancelled : b));
			if (booking.date >= summary.monthStart && booking.date <= summary.monthEnd)
				usedThisMonth -= 1;
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
				max={summary.lessonsPerMonth}
				label={m.rider_plan_left({ left, total: summary.lessonsPerMonth })}
			/>
			<p class="sj-small">{m.rider_plan_left({ left, total: summary.lessonsPerMonth })}</p>
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
					? academyCancelText(booking)
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
			{#if booking.id === firstCancelled}
				<NotifyOffer {publicKey} {locale} {device} />
			{/if}
		{/each}
	</div>
</Card>

{#if past.length > 0}
	<Card>
		<section class="sj-stack" aria-labelledby={pastId}>
			<h2 class="sj-heading" id={pastId}>{m.rider_past_title()}</h2>
			<ul class="past" role="list">
				{#each past as booking (booking.id)}
					<li>
						<span>{when(booking)} <span dir="ltr">{booking.start}</span></span>
						<span class="sj-small sj-muted">
							{#if booking.status === 'cancelled'}
								{booking.cancelledByAcademy ? academyCancelText(booking) : m.booking_cancelled()}
							{:else}
								{booking.ownHorseName ?? m.booking_school_horse()}
							{/if}
						</span>
					</li>
				{/each}
			</ul>
		</section>
	</Card>
{/if}

<style>
	.past {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.past li {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: var(--space-2);
	}
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
