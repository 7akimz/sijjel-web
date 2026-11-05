<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { untrack } from 'svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { RiderRide, RiderRides } from '#lib/api/member-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { formatDayNumber, formatWeekday } from '#lib/format.js';
	import { monthCounts, monthTitle } from '#lib/forms/rider-rides.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Icon } from '#lib/ui/index.js';

	type Props = { memberId: string; rides: RiderRides; today: string; locale: Locale };
	let { memberId, rides, today, locale }: Props = $props();

	const initial = untrack(() => rides);
	let byMonth = $state<Record<string, RiderRide[]>>(
		initial.month ? { [initial.month]: initial.rides } : {}
	);
	const opened = new SvelteSet<string>(initial.month ? [initial.month] : []);
	const loading = new SvelteSet<string>();
	let failure = $state<string>();

	const thisMonth = $derived(today.slice(0, 7));
	const thisMonthMissing = $derived(
		rides.months.length > 0 && !rides.months.some((month) => month.month === thisMonth)
	);

	async function toggle(month: string, open: boolean) {
		if (!open) {
			opened.delete(month);
			return;
		}
		opened.add(month);
		if (byMonth[month] || loading.has(month)) return;
		loading.add(month);
		failure = undefined;
		try {
			const page = await api<RiderRides>(
				`/academy/members/${memberId}/rides?month=${encodeURIComponent(month)}`
			);
			byMonth[month] = page.rides;
		} catch (e) {
			failure = errorText(e instanceof ApiError ? e.code : 'internal_error');
		} finally {
			loading.delete(month);
		}
	}
</script>

<section class="sj-stack section">
	{#if rides.months.length === 0}
		<p class="sj-muted">{m.rider_rides_none({}, { locale })}</p>
	{/if}

	{#if thisMonthMissing}
		<p class="no-rides">
			<span class="strong">{monthTitle(thisMonth, locale)}</span>
			<span class="count">· {m.rider_rides_month_none({}, { locale })}</span>
		</p>
	{/if}

	{#each rides.months as month (month.month)}
		<details
			class="fold"
			open={month.month === initial.month}
			ontoggle={(e) => toggle(month.month, e.currentTarget.open)}
		>
			<summary>
				<span class="chevron">
					<Icon
						name={opened.has(month.month) ? 'expand_more' : 'chevron_right'}
						directional={!opened.has(month.month)}
					/>
				</span>
				<span class="strong">{monthTitle(month.month, locale)}</span>
				<span class="count">· {monthCounts(month, locale)}</span>
			</summary>
			{#if byMonth[month.month]}
				<ul class="sj-list" role="list">
					{#each byMonth[month.month] as ride (ride.bookingId)}
						<li class="sj-list__row ride">
							<span class="date">
								<span class="day">{formatDayNumber(ride.date, locale)}</span>
								<span class="weekday">{formatWeekday(ride.date, locale)}</span>
							</span>
							<span class="sj-list__main">
								<span class="line">
									<span class="strong"
										><bdi>{ride.horseName ?? m.booking_school_horse({}, { locale })}</bdi></span
									>
									{#if ride.trainerName}
										<span class="sj-small sj-muted trainer">
											<span class="tic"><Icon name="person" size={20} /></span>
											<span class="sj-visually-hidden">{m.horse_rides_trainer({}, { locale })}</span
											>
											<bdi>{ride.trainerName}</bdi>
										</span>
									{/if}
								</span>
								{#if ride.note}
									<span class="note">
										<span class="tic"><Icon name="edit_note" size={20} /></span>
										<span class="sj-visually-hidden">{m.horse_rides_note({}, { locale })}</span>
										<bdi>{ride.note}</bdi>
									</span>
								{/if}
							</span>
						</li>
					{/each}
				</ul>
			{:else if loading.has(month.month)}
				<p class="sj-small sj-muted loading" role="status">
					{m.rider_rides_loading({}, { locale })}
				</p>
			{/if}
		</details>
	{/each}

	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
</section>

<style>
	.section {
		gap: var(--space-2);
	}
	p {
		margin: 0;
	}
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.strong {
		font-weight: 600;
	}
	.count {
		font-size: 14px;
		color: var(--ink-muted);
	}
	.no-rides {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-1);
		padding-inline: var(--space-1);
		color: var(--ink-muted);
	}
	.fold {
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		background: var(--surface);
		overflow: hidden;
	}
	summary {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-1) var(--space-2);
		min-block-size: 48px;
		padding: var(--space-1) var(--space-3);
		cursor: pointer;
		list-style: none;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary:hover {
		background: var(--hover-veil);
	}
	.chevron {
		display: inline-flex;
		color: var(--ink-muted);
	}
	.fold .sj-list {
		border: 0;
		border-block-start: 1px solid var(--line);
		border-radius: 0;
		background: none;
	}
	.ride {
		align-items: flex-start;
		min-block-size: auto;
		padding-block: var(--space-2);
	}
	li + li.ride {
		border-block-start: 1px solid var(--line);
	}
	.date {
		display: flex;
		flex-direction: column;
		min-inline-size: 2.6em;
		line-height: 1.15;
	}
	.day {
		font: 600 16px/22px var(--font-display);
		font-variant-numeric: tabular-nums;
	}
	.weekday {
		font-size: 12px;
		color: var(--ink-muted);
	}
	.line {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-1) var(--space-2);
		white-space: normal;
	}
	.trainer {
		display: inline-flex;
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
	.loading {
		padding: var(--space-3);
		border-block-start: 1px solid var(--line);
	}
</style>
