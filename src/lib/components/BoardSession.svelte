<script lang="ts">
	import type { Snippet } from 'svelte';
	import { localName } from '#lib/academy.js';
	import type { BoardArena, BoardRider, BoardSession } from '#lib/api/board-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { groupByArena, problemText, trainerGroups, waitingText } from '#lib/forms/board.js';
	import { m } from '#lib/paraglide/messages.js';
	import { EmptyState, Icon } from '#lib/ui/index.js';

	type Props = {
		session: BoardSession;
		locale: Locale;
		onrider: (rider: BoardRider) => void;
		ontrainer: (arena: BoardArena) => void;
		selecting?: boolean;
		selected?: string[];
		ontoggle?: (bookingId: string) => void;
		/** Shown in the callout over riders without an arena. */
		waitingAction?: Snippet;
	};
	let {
		session,
		locale,
		onrider,
		ontrainer,
		selecting = false,
		selected = [],
		ontoggle = () => {},
		waitingAction
	}: Props = $props();

	const groups = $derived(groupByArena(session));
	const waiting = $derived(groups.find((g) => !g.arena));

	function horseLabel(rider: BoardRider) {
		if (rider.horseSource === 'own') return rider.ownHorseName ?? '';
		return rider.horse?.name ?? m.board_pick_horse({}, { locale });
	}
</script>

{#if session.riders.length === 0}
	<EmptyState icon="event_available" title={m.board_no_riders({}, { locale })} />
{:else}
	{#if waiting}
		<section class="waiting">
			<div class="head">
				<Icon name="pending_actions" size={20} />
				<h2 class="waiting-title">{waitingText(waiting.riders.length, locale)}</h2>
				{@render waitingAction?.()}
			</div>
			{@render riders(null, waiting.riders)}
		</section>
	{/if}
	<div class="arenas">
		{#each groups.filter((g) => g.arena) as group (group.arena?.id)}
			{#if group.arena}
				{@const arena = group.arena}
				{@const taken = arena.capacity - arena.placesLeft}
				<section class="arena">
					<div class="head">
						<h2 class="sj-heading">{arena.name}</h2>
						<span class="count">
							<Icon name="group" size={20} />
							<span aria-hidden="true"
								>{m.board_arena_count({ count: taken, capacity: arena.capacity }, { locale })}</span
							>
							<span class="sj-visually-hidden"
								>{m.board_arena_count_label(
									{ count: taken, capacity: arena.capacity },
									{ locale }
								)}</span
							>
						</span>
						<span class="grow"></span>
						{#if session.editable}
							<button
								type="button"
								class="sj-btn sj-btn--quiet trainer"
								onclick={() => ontrainer(arena)}
							>
								<span class="sj-visually-hidden"
									>{m.board_trainer_named({ arena: arena.name }, { locale })}</span
								>
								<Icon name={arena.trainer ? 'person' : 'person_add'} size={20} />
								<bdi>{arena.trainer?.name ?? m.board_add_trainer({}, { locale })}</bdi>
							</button>
						{:else}
							<span class="trainer-name sj-small">
								<Icon name="person" size={20} />
								<bdi>{arena.trainer?.name ?? m.board_no_trainer({}, { locale })}</bdi>
							</span>
						{/if}
					</div>
					{#if group.riders.length > 0}
						{@render riders(arena, group.riders)}
					{/if}
				</section>
			{/if}
		{/each}
	</div>
{/if}

{#snippet riders(arena: BoardArena | null, list: BoardRider[])}
	{@const subgroups = trainerGroups(arena, list)}
	{@const split =
		subgroups.length > 1 || subgroups.some((g) => g.trainer?.id !== arena?.trainer?.id)}
	<div class="sj-list">
		{#if split}
			{#each subgroups as sub (sub.trainer?.id ?? 'none')}
				<h3 class="subgroup sj-small">
					<bdi>{sub.trainer?.name ?? m.board_no_trainer({}, { locale })}</bdi> · {sub.riders.length}
				</h3>
				{#each sub.riders as rider (rider.bookingId)}
					{@render row(rider)}
				{/each}
			{/each}
		{:else}
			{#each list as rider (rider.bookingId)}
				{@render row(rider)}
			{/each}
		{/if}
	</div>
{/snippet}

{#snippet row(rider: BoardRider)}
	{@const ticked = selected.includes(rider.bookingId)}
	<button
		type="button"
		class={['row', ticked && 'ticked']}
		aria-pressed={selecting ? ticked : undefined}
		onclick={() => (selecting ? ontoggle(rider.bookingId) : onrider(rider))}
	>
		{#if selecting}
			<Icon name={ticked ? 'check_box' : 'check_box_outline_blank'} size={20} filled={ticked} />
		{/if}
		<span class="who">
			<span class="name" dir="auto">{rider.name}</span>
			{#if rider.level}<span class="level" dir="auto">{localName(rider.level, locale)}</span>{/if}
		</span>
		{#if rider.problems.length > 0}
			<span
				class="problem"
				role="img"
				aria-label={rider.problems.map((p) => problemText(p, locale)).join(' ')}
			>
				<Icon name="warning" size={20} filled />
			</span>
		{/if}
		{#if !rider.horse && rider.horseSource === 'school'}
			<span class="horse pick">{horseLabel(rider)}</span>
		{:else}
			<span class="horse"><Icon name="horseshoe" size={20} /><bdi>{horseLabel(rider)}</bdi></span>
		{/if}
	</button>
{/snippet}

<style>
	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.arenas {
		display: grid;
		gap: var(--space-6);
		align-items: start;
	}
	@media (min-width: 720px) {
		.arenas {
			grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		}
	}
	.head {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-block-size: var(--touch-target);
	}
	.grow {
		flex: 1;
	}
	.count,
	.trainer-name {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font-size: 14px;
		color: var(--ink-muted);
		font-variant-numeric: tabular-nums;
	}
	.trainer {
		padding-inline: var(--space-2);
	}
	.waiting {
		padding: var(--space-3);
		border-radius: var(--radius-lg);
		background: var(--brass-soft);
		color: var(--brass);
	}
	.waiting .head {
		font-weight: 600;
	}
	.waiting-title {
		flex: 1;
		margin: 0;
		font: inherit;
	}
	.waiting :global(.sj-btn--quiet) {
		color: var(--brass);
	}
	.waiting .sj-list {
		border-color: transparent;
		color: var(--ink);
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		inline-size: 100%;
		min-block-size: 52px;
		padding: var(--space-3) var(--space-4);
		border: 0;
		background: none;
		color: var(--ink);
		font: inherit;
		text-align: start;
		cursor: pointer;
	}
	.row + .row,
	.subgroup + .row {
		border-block-start: 1px solid var(--line);
	}
	.row:hover {
		background: var(--hover-veil);
	}
	.ticked {
		background: var(--accent-soft);
	}
	.subgroup {
		margin: 0;
		padding: var(--space-2) var(--space-4) var(--space-1);
		color: var(--ink-muted);
		font-weight: 600;
	}
	.row + .subgroup {
		border-block-start: 1px solid var(--line);
	}
	.who {
		flex: 1;
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		min-inline-size: 0;
	}
	.name {
		font-weight: 600;
	}
	.level {
		font-size: 13px;
		color: var(--ink-muted);
	}
	.horse {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font-weight: 600;
	}
	.horse :global(.sj-icon) {
		color: var(--ink-muted);
	}
	.pick {
		color: var(--accent);
	}
	.problem {
		display: inline-flex;
		color: var(--brass);
	}
</style>
