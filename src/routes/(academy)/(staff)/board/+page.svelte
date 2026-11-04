<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import BoardPlanner from '#lib/components/BoardPlanner.svelte';
	import BoardTimes from '#lib/components/BoardTimes.svelte';
	import { isAcademyAdmin } from '#lib/academy/admin.js';
	import type { BoardSession } from '#lib/api/board-types.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Button, EmptyState } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let session = $derived<BoardSession | null>(data.session);

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
			<BoardTimes
				times={session.times}
				date={session.date}
				current={session.start}
				locale={data.locale}
			/>

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
</style>
