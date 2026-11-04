<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { HorseRides } from '#lib/api/academy-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { daySessionsText, isFullDay, rideDayLabel, weekSummary } from '#lib/forms/horse-rides.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Icon } from '#lib/ui/index.js';

	type Props = { horseId: string; rides: HorseRides; locale: Locale };
	let { horseId, rides, locale }: Props = $props();

	let days = $state(untrack(() => rides.days));
	let before = $state(untrack(() => rides.before));
	let busy = $state(false);
	let failure = $state<string>();

	async function loadOlder() {
		if (!before) return;
		busy = true;
		failure = undefined;
		try {
			const older = await api<HorseRides>(
				`/academy/horses/${horseId}/rides?before=${encodeURIComponent(before)}`
			);
			days = [...days, ...older.days];
			before = older.before;
		} catch (e) {
			failure = errorText(e instanceof ApiError ? e.code : 'internal_error');
		} finally {
			busy = false;
		}
	}
</script>

<section class="sj-stack section">
	<p class="sj-small sj-muted summary">{weekSummary(rides.lastWeek, locale)}</p>

	{#if days.length === 0}
		<p class="sj-muted">{m.horse_rides_none({}, { locale })}</p>
	{/if}

	{#each days as day (day.date)}
		{@const full = isFullDay(day.rides.length, rides.maxPerDay)}
		<div class="day">
			<h2 class="day-head">
				<span class="strong">{rideDayLabel(day.date, locale)}</span>
				<span class={['count', full && 'full']}>
					{daySessionsText(day.rides.length, rides.maxPerDay, locale)}
				</span>
			</h2>
			<ul class="sj-list" role="list">
				{#each day.rides as ride (ride.bookingId)}
					<li>
						<a
							class="sj-list__row ride"
							href={resolve('/(academy)/(staff)/members/[id]', { id: ride.memberId })}
						>
							<span class="time" dir="ltr">{ride.start}</span>
							<span class="sj-list__main">
								<span class="strong"><bdi>{ride.riderName}</bdi></span>
								{#if ride.arenaName || ride.trainerName}
									<span class="sj-small sj-muted meta">
										{#if ride.arenaName}<bdi>{ride.arenaName}</bdi>{/if}
										{#if ride.arenaName && ride.trainerName}<span aria-hidden="true">·</span>{/if}
										{#if ride.trainerName}
											<span class="tic"><Icon name="person" size={20} /></span>
											<span class="sj-visually-hidden">{m.horse_rides_trainer({}, { locale })}</span
											>
											<bdi>{ride.trainerName}</bdi>
										{/if}
									</span>
								{/if}
								{#if ride.note}
									<span class="note">
										<span class="tic"><Icon name="edit_note" size={20} /></span>
										<span class="sj-visually-hidden">{m.horse_rides_note({}, { locale })}</span>
										<bdi>{ride.note}</bdi>
									</span>
								{/if}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/each}

	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}

	{#if before}
		<div>
			<Button variant="quiet" disabled={busy} onclick={loadOlder}>
				{m.horse_rides_older({}, { locale })}
			</Button>
		</div>
	{/if}
</section>

<style>
	.section {
		gap: var(--space-2);
	}
	.summary {
		margin: 0 0 var(--space-2);
	}
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.strong {
		font-weight: 600;
	}
	.day {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.day + .day {
		margin-block-start: var(--space-2);
	}
	.day-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-1);
		margin: 0;
		font: inherit;
	}
	.count {
		font-size: 14px;
		color: var(--ink-muted);
	}
	.count::before {
		content: '· ';
	}
	.count.full {
		color: var(--ink);
		font-weight: 600;
	}
	.ride {
		align-items: flex-start;
		color: var(--ink);
		text-decoration: none;
	}
	.ride:hover {
		background: var(--hover-veil);
	}
	li + li .ride {
		border-block-start: 1px solid var(--line);
	}
	.time {
		min-inline-size: 3.2em;
		font: 600 15px/22px var(--font-display);
		font-variant-numeric: tabular-nums;
	}
	.meta {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px;
	}
	.sj-list__main > .note {
		display: flex;
		align-items: flex-start;
		gap: 4px;
		font-size: 14px;
		line-height: 20px;
		color: var(--ink);
		white-space: normal;
		overflow: visible;
		text-overflow: clip;
	}
	.note bdi {
		min-inline-size: 0;
	}
	.note .tic {
		margin-block-start: 2px;
	}
	.tic {
		display: inline-flex;
		color: var(--ink-muted);
	}
	.tic :global(.sj-icon) {
		font-size: 16px;
	}
</style>
