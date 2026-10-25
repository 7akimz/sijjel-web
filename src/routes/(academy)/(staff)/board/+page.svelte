<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import BoardPlanner from '#lib/components/BoardPlanner.svelte';
	import { isAcademyAdmin } from '#lib/academy/admin.js';
	import type { BoardSession } from '#lib/api/board-types.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Button, EmptyState } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let session = $derived<BoardSession | null>(data.session);
	// The selected time can sit far along the row on a phone, so bring it into view.
	function showCurrent(link: HTMLElement, current: boolean) {
		if (current) link.scrollIntoView({ block: 'nearest', inline: 'center' });
		return {
			update(now: boolean) {
				if (now) link.scrollIntoView({ block: 'nearest', inline: 'center' });
			}
		};
	}

	function changeDate(event: Event) {
		const value = (event.currentTarget as HTMLInputElement).value;
		if (value) goto(resolve(`/(academy)/(staff)/board?date=${value}`));
	}
</script>

<svelte:head>
	<title>{m.board_title()}</title>
</svelte:head>

<div class="sj-page">
	{#if !session}
		<h1 class="sj-title">{m.board_title()}</h1>
		<EmptyState icon="lock" title={m.board_setup_title()}>
			{m.board_setup_body()}
			{#snippet action()}
				{#if isAcademyAdmin(data.membership)}
					<Button href={resolve('/')}>{m.board_setup_action()}</Button>
				{/if}
			{/snippet}
		</EmptyState>
	{:else}
		<div class="top">
			<h1 class="sj-title">{m.board_title()}</h1>
			<label class="date">
				<span class="sj-label">{m.board_date()}</span>
				<input class="sj-input" type="date" value={session.date} onchange={changeDate} />
			</label>
		</div>

		{#if session.times.length === 0}
			<EmptyState icon="event_busy" title={m.board_no_sessions()} />
		{:else}
			<nav class="times" aria-label={m.board_times()}>
				{#each session.times as time (time.start)}
					<a
						class={['time', time.start === session.start && 'current']}
						href={resolve(`/(academy)/(staff)/board?date=${session.date}&start=${time.start}`)}
						aria-current={time.start === session.start ? 'true' : undefined}
						use:showCurrent={time.start === session.start}
					>
						<span dir="ltr">{time.start}</span>
						{#if time.hasProblem}<i class="dot" aria-hidden="true"></i>{/if}
					</a>
				{/each}
			</nav>

			<p class="sj-muted sj-small" dir="ltr">{session.start} – {session.end}</p>
			<BoardPlanner {session} locale={data.locale} onsession={(next) => (session = next)} />
		{/if}
	{/if}
</div>

<style>
	.top {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--space-3);
	}
	.date {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.times {
		display: flex;
		gap: var(--space-2);
		overflow-x: auto;
		padding-block: var(--space-1);
	}
	.time {
		position: relative;
		padding: var(--space-2) var(--space-3);
		border-radius: 999px;
		border: 1px solid var(--line);
		background: var(--surface);
		color: var(--ink);
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
	}
	.time.current {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--on-accent);
	}
	.dot {
		position: absolute;
		inset-block-start: 3px;
		inset-inline-end: 5px;
		inline-size: 7px;
		block-size: 7px;
		border-radius: 50%;
		background: var(--brass);
	}
</style>
