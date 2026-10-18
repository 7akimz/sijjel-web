<script lang="ts">
	import type { SlotView } from '#lib/api/member-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { formatDate } from '#lib/format.js';
	import {
		dayName,
		groupByDate,
		shiftWeek,
		slotReasonText,
		weekEndOf
	} from '#lib/forms/booking.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Button, EmptyState, Icon, SessionSlot } from '#lib/ui/index.js';

	type Props = {
		slots: SlotView[];
		week: string;
		firstWeek: string;
		school: boolean;
		busy: boolean;
		locale: Locale;
		weekHref: (week: string) => string;
		confirmText: (slot: SlotView) => string;
		onbook: (slot: SlotView) => Promise<void>;
	};
	let { slots, week, firstWeek, school, busy, locale, weekHref, confirmText, onbook }: Props =
		$props();

	let pending = $state.raw<SlotView | null>(null);

	const days = $derived(groupByDate(slots));
	const dayDate = (date: string) => formatDate(`${date}T00:00:00Z`, locale);

	function slotState(slot: SlotView) {
		if (slot.booked) return 'booked' as const;
		if (slot.reason === 'full') return 'full' as const;
		if (!slot.canBook) return 'no-horse' as const;
		if (school && slot.suitableHorsesFree === 1) return 'last-horse' as const;
		return 'open' as const;
	}

	function slotNote(slot: SlotView) {
		if (slot.reason) return slotReasonText(slot.reason, locale);
		if (!school) return m.book_own_horse();
		return m.book_horses_free({ count: slot.suitableHorsesFree ?? 0 });
	}

	async function book(slot: SlotView) {
		await onbook(slot);
		pending = null;
	}
</script>

<nav class="week" aria-label={m.book_title()}>
	{#if week <= firstWeek}
		<Button variant="quiet" disabled
			><Icon name="chevron_left" directional />{m.book_week_prev()}</Button
		>
	{:else}
		<Button variant="quiet" href={weekHref(shiftWeek(week, -1))}
			><Icon name="chevron_left" directional />{m.book_week_prev()}</Button
		>
	{/if}
	<span class="sj-small">
		{m.book_week_range({ from: dayDate(week), to: dayDate(weekEndOf(week)) })}
	</span>
	<Button variant="quiet" href={weekHref(shiftWeek(week, 1))}
		>{m.book_week_next()}<Icon name="chevron_right" directional /></Button
	>
</nav>

{#if days.length === 0}
	<EmptyState icon="event_busy" title={m.book_no_slots()} />
{/if}
{#each days as day (day.date)}
	<section class="sj-stack">
		<h2 class="sj-heading">{dayName(day.date, locale)} · {dayDate(day.date)}</h2>
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
