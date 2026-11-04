<script lang="ts">
	import { resolve } from '$app/paths';
	import type { BoardTime } from '#lib/api/board-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { riderCountText } from '#lib/forms/subscription.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Icon } from '#lib/ui/index.js';

	type Props = { times: BoardTime[]; date: string; current: string; locale: Locale };
	let { times, date, current, locale }: Props = $props();

	// The selected time can sit far along the row on a phone, so bring it into view.
	function showCurrent(link: HTMLElement, selected: boolean) {
		if (selected) link.scrollIntoView({ block: 'nearest', inline: 'center' });
		return {
			update(now: boolean) {
				if (now) link.scrollIntoView({ block: 'nearest', inline: 'center' });
			}
		};
	}
</script>

<nav class="times" aria-label={m.board_times({}, { locale })}>
	{#each times as time (time.start)}
		<a
			class={['time', time.start === current && 'current']}
			href={resolve(`/(academy)/(staff)/board?date=${date}&start=${time.start}`)}
			aria-current={time.start === current ? 'true' : undefined}
			use:showCurrent={time.start === current}
		>
			<span class="start" dir="ltr">{time.start}</span>
			<span class={['riders', time.riders > 0 && 'booked']}>
				{#if time.hasProblem}
					<span class="problem" role="img" aria-label={m.board_time_problem({}, { locale })}>
						<Icon name="warning" size={20} filled />
					</span>
				{/if}
				{time.riders > 0 ? riderCountText(time.riders, locale) : m.board_time_empty({}, { locale })}
			</span>
		</a>
	{/each}
</nav>

<style>
	.times {
		display: flex;
		gap: var(--space-2);
		overflow-x: auto;
		padding-block: var(--space-1);
	}
	.time {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		min-inline-size: 88px;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		border: 1px solid var(--line);
		background: var(--surface);
		color: var(--ink);
		text-decoration: none;
		white-space: nowrap;
	}
	.start {
		font: 600 16px/20px var(--font-display);
		font-variant-numeric: tabular-nums;
	}
	.riders {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font-size: 13px;
		line-height: 18px;
		color: var(--ink-muted);
	}
	.booked {
		color: var(--ink);
		font-weight: 600;
	}
	.problem {
		display: inline-flex;
		color: var(--brass);
	}
	.current {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--on-accent);
	}
	.current .riders {
		color: var(--on-accent);
	}
	.current .problem {
		color: var(--on-accent);
	}
</style>
