<script lang="ts">
	import { resolve } from '$app/paths';
	import type { BoardDay } from '#lib/api/board-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { formatDayMonth, formatWeekday } from '#lib/format.js';
	import { riderCountText } from '#lib/forms/subscription.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Icon } from '#lib/ui/index.js';

	type Props = { days: BoardDay[]; current: string; locale: Locale };
	let { days, current, locale }: Props = $props();

	const DAY_MS = 86_400_000;
	function shift(date: string, by: number) {
		return new Date(Date.parse(`${date}T00:00:00Z`) + by * DAY_MS).toISOString().slice(0, 10);
	}

	const week = $derived(
		days.length
			? `${formatDayMonth(days[0]!.date, locale)} – ${formatDayMonth(days[days.length - 1]!.date, locale)}`
			: ''
	);

	function label(day: BoardDay) {
		const name = `${formatWeekday(day.date, locale)} ${formatDayMonth(day.date, locale)}`;
		const riders =
			day.riders > 0 ? riderCountText(day.riders, locale) : m.board_time_empty({}, { locale });
		return m.board_day_label({ day: name, riders }, { locale });
	}
</script>

<div class="strip">
	<div class="week">
		<a
			class="sj-btn sj-btn--quiet sj-btn--icon"
			href={resolve(`/(academy)/(staff)/board?date=${shift(current, -7)}`)}
			aria-label={m.board_week_prev({}, { locale })}
		>
			<Icon name="chevron_left" directional />
		</a>
		<span class="range">{week}</span>
		<a
			class="sj-btn sj-btn--quiet sj-btn--icon"
			href={resolve(`/(academy)/(staff)/board?date=${shift(current, 7)}`)}
			aria-label={m.board_week_next({}, { locale })}
		>
			<Icon name="chevron_right" directional />
		</a>
	</div>
	<nav class="days" aria-label={m.board_days({}, { locale })}>
		{#each days as day (day.date)}
			<a
				class={['day', day.date === current && 'current']}
				href={resolve(`/(academy)/(staff)/board?date=${day.date}`)}
				aria-current={day.date === current ? 'date' : undefined}
				aria-label={label(day)}
			>
				<span class="weekday" aria-hidden="true">{formatWeekday(day.date, locale)}</span>
				<span class="number" aria-hidden="true">{Number(day.date.slice(8))}</span>
				<span class={['riders', day.riders > 0 && 'booked']} aria-hidden="true">
					{#if day.riders > 0}<Icon name="group" size={20} />{day.riders}{:else}–{/if}
				</span>
			</a>
		{/each}
	</nav>
</div>

<style>
	.strip {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.week {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.range {
		font-weight: 600;
	}
	.days {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: var(--space-2);
	}
	.day {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding-block: 6px;
		border-radius: var(--radius-md);
		color: var(--ink);
		text-decoration: none;
	}
	.weekday {
		font-size: 12px;
		line-height: 16px;
		color: var(--ink-muted);
	}
	.number {
		font: 600 17px/22px var(--font-display);
		font-variant-numeric: tabular-nums;
	}
	.riders {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		font-size: 12px;
		line-height: 16px;
		color: var(--ink-muted);
	}
	.riders :global(.sj-icon) {
		font-size: 14px;
	}
	.booked {
		color: var(--ink);
		font-weight: 600;
	}
	.current {
		background: var(--accent-soft);
		color: var(--on-accent-soft);
	}
	.current .weekday,
	.current .riders {
		color: var(--on-accent-soft);
	}
</style>
