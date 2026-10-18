<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { BookingView, SlotView } from '#lib/api/member-types.js';
	import { formatDate } from '#lib/format.js';
	import {
		bookingErrorText,
		dayName,
		groupByDate,
		riderBlockReason,
		riderBlockText,
		shiftWeek,
		slotReasonText,
		weekEndOf
	} from '#lib/forms/booking.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, EmptyState, Icon, SessionSlot } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let pending = $state.raw<SlotView | null>(null);
	let busy = $state(false);
	let notice = $state('');
	let failure = $state('');

	const days = $derived(groupByDate(data.slots));
	const school = $derived(data.summary.horseSource !== 'own');
	const blocked = $derived(riderBlockReason(data.summary));
	const firstWeek = $derived(data.week <= data.summary.weekStart);
	const dayDate = (date: string) => formatDate(`${date}T00:00:00Z`, data.locale);

	function weekHref(week: string) {
		return resolve(`/(academy)/(rider)/book?week=${week}`);
	}

	function slotState(slot: SlotView) {
		if (slot.booked) return 'booked' as const;
		if (slot.reason === 'full') return 'full' as const;
		if (!slot.canBook) return 'no-horse' as const;
		if (school && slot.suitableHorsesFree === 1) return 'last-horse' as const;
		return 'open' as const;
	}

	function slotNote(slot: SlotView) {
		if (slot.reason) return slotReasonText(slot.reason, data.locale);
		if (!school) return m.book_own_horse();
		return m.book_horses_free({ count: slot.suitableHorsesFree ?? 0 });
	}

	function confirmText(slot: SlotView) {
		const inputs = { day: dayName(slot.date, data.locale), time: slot.start };
		return school ? m.book_confirm_school(inputs) : m.book_confirm_own(inputs);
	}

	async function book(slot: SlotView) {
		busy = true;
		notice = '';
		failure = '';
		try {
			await api<BookingView>('/bookings', {
				method: 'POST',
				body: { date: slot.date, start: slot.start }
			});
			notice = m.book_done({ day: dayName(slot.date, data.locale), time: slot.start });
		} catch (e) {
			failure =
				e instanceof ApiError ? bookingErrorText(e, data.locale) : errorText('internal_error');
		} finally {
			busy = false;
			pending = null;
			await invalidateAll();
		}
	}
</script>

<svelte:head>
	<title>{m.book_title()}</title>
</svelte:head>

<div class="sj-page">
	<div class="sj-stack">
		<h1 class="sj-title">{m.book_title()}</h1>
		<p class="sj-muted">
			{m.rider_plan_left({
				left: data.summary.leftThisWeek,
				perWeek: data.summary.sessionsPerWeek
			})}
		</p>
	</div>

	{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}
	{#if failure}<Banner icon="error" tone="danger">{failure}</Banner>{/if}
	{#if blocked}
		<Banner icon="info" tone="pending">{riderBlockText(blocked, data.locale)}</Banner>
	{/if}

	<nav class="week" aria-label={m.book_title()}>
		{#if firstWeek}
			<Button variant="quiet" disabled
				><Icon name="chevron_left" directional />{m.book_week_prev()}</Button
			>
		{:else}
			<Button variant="quiet" href={weekHref(shiftWeek(data.week, -1))}
				><Icon name="chevron_left" directional />{m.book_week_prev()}</Button
			>
		{/if}
		<span class="sj-small">
			{m.book_week_range({ from: dayDate(data.week), to: dayDate(weekEndOf(data.week)) })}
		</span>
		<Button variant="quiet" href={weekHref(shiftWeek(data.week, 1))}
			>{m.book_week_next()}<Icon name="chevron_right" directional /></Button
		>
	</nav>

	{#if days.length === 0}
		<EmptyState icon="event_busy" title={m.book_no_slots()} />
	{/if}
	{#each days as day (day.date)}
		<section class="sj-stack">
			<h2 class="sj-heading">{dayName(day.date, data.locale)} · {dayDate(day.date)}</h2>
			{#each day.slots as slot (slot.start)}
				<SessionSlot
					start={slot.start}
					end={slot.end}
					endLabel={m.book_end({ time: slot.end })}
					placesLeft={slot.placesLeft}
					capacity={slot.placesLeft}
					horsesFree={school ? (slot.suitableHorsesFree ?? 0) : 0}
					horsesTotal={school ? (slot.suitableHorsesTotal ?? 0) : 0}
					state={slotState(slot)}
					placesLabel={m.book_places_left({ count: slot.placesLeft })}
					note={slotNote(slot)}
				>
					{#snippet action()}
						{#if slot.canBook && pending !== slot}
							<Button disabled={busy} onclick={() => (pending = slot)}>{m.book_action()}</Button>
						{/if}
					{/snippet}
				</SessionSlot>
				{#if pending === slot}
					<div class="confirm" role="group" aria-label={confirmText(slot)}>
						<p>{confirmText(slot)}</p>
						<div class="sj-row">
							<Button disabled={busy} onclick={() => book(slot)}>{m.book_confirm_action()}</Button>
							<Button variant="quiet" disabled={busy} onclick={() => (pending = null)}
								>{m.action_cancel()}</Button
							>
						</div>
					</div>
				{/if}
			{/each}
		</section>
	{/each}
</div>

<style>
	.week {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		flex-wrap: wrap;
	}
	.confirm {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3);
		border-radius: var(--radius-md);
		background: var(--surface-sunk);
	}
	.confirm p {
		margin: 0;
	}
</style>
