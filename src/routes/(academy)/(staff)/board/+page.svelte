<script lang="ts">
	import { resolve } from '$app/paths';
	import BoardDays from '#lib/components/BoardDays.svelte';
	import BoardPlanner from '#lib/components/BoardPlanner.svelte';
	import BoardTimes from '#lib/components/BoardTimes.svelte';
	import { isAcademyAdmin } from '#lib/academy/admin.js';
	import type { BoardSession } from '#lib/api/board-types.js';
	import { canSelect } from '#lib/forms/board.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Button, EmptyState } from '#lib/ui/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let session = $derived<BoardSession | null>(data.session);
	let selecting = $state(false);
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
		<div class="sj-page-head">
			<h1 class="sj-title">{m.board_title()}</h1>
			{#if session.times.length > 0 && canSelect(session) && !selecting}
				<Button variant="secondary" icon="checklist" onclick={() => (selecting = true)}>
					{m.board_select()}
				</Button>
			{/if}
		</div>
		<BoardDays days={session.days} current={session.date} locale={data.locale} />

		{#if session.times.length === 0}
			<EmptyState icon="event_busy" title={m.board_no_sessions()} />
		{:else}
			<BoardTimes
				times={session.times}
				date={session.date}
				current={session.start}
				locale={data.locale}
			/>
			<BoardPlanner
				{session}
				locale={data.locale}
				onsession={(next) => (session = next)}
				bind:selecting
			/>
		{/if}
	{/if}
</div>
