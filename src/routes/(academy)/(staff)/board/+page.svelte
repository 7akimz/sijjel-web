<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import BoardSessionView from '#lib/components/BoardSession.svelte';
	import RiderSheet from '#lib/components/RiderSheet.svelte';
	import SuggestHorses from '#lib/components/SuggestHorses.svelte';
	import TrainerPicker from '#lib/components/TrainerPicker.svelte';
	import type { BoardArena, BoardRider, BoardSession } from '#lib/api/board-types.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, EmptyState } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let session = $derived<BoardSession>(data.session);
	let rider = $state<BoardRider | null>(null);
	let trainerArena = $state<BoardArena | null>(null);
	let notice = $state('');
	let unplaceable = $state<string[]>([]);

	function applySession(next: BoardSession, stranded: string[]) {
		session = next;
		unplaceable = stranded;
		notice = m.board_saved();
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
				>
					<span dir="ltr">{time.start}</span>
					{#if time.hasProblem}<i class="dot" aria-hidden="true"></i>{/if}
				</a>
			{/each}
		</nav>

		{#key session.date + session.start}
			<p class="sj-muted sj-small" dir="ltr">{session.start} – {session.end}</p>
			<SuggestHorses {session} locale={data.locale} onsession={(next) => (session = next)} />
			{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}
			{#if unplaceable.length > 0}
				<Banner tone="pending" icon="warning"
					>{m.board_unplaceable({ names: unplaceable.join(', ') })}</Banner
				>
			{/if}
			<BoardSessionView
				{session}
				locale={data.locale}
				onrider={(r) => {
					notice = '';
					rider = r;
				}}
				ontrainer={(a) => {
					notice = '';
					trainerArena = a;
				}}
			/>
			{#if rider}
				<RiderSheet
					{session}
					{rider}
					locale={data.locale}
					onclose={() => (rider = null)}
					onsession={applySession}
				/>
			{/if}
			{#if trainerArena}
				<TrainerPicker
					{session}
					arena={trainerArena}
					locale={data.locale}
					onclose={() => (trainerArena = null)}
					onsession={(next) => {
						session = next;
						trainerArena = null;
					}}
				/>
			{/if}
		{/key}
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
