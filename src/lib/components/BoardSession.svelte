<script lang="ts">
	import type { BoardArena, BoardRider, BoardSession } from '#lib/api/board-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { groupByArena, problemText, trainerGroups } from '#lib/forms/board.js';
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
	};
	let {
		session,
		locale,
		onrider,
		ontrainer,
		selecting = false,
		selected = [],
		ontoggle = () => {}
	}: Props = $props();

	const groups = $derived(groupByArena(session));

	function horseLabel(rider: BoardRider) {
		if (rider.horseSource === 'own') return rider.ownHorseName ?? '';
		return rider.horse?.name ?? m.board_pick_horse({}, { locale });
	}
</script>

{#if session.riders.length === 0}
	<EmptyState icon="event_available" title={m.board_no_riders({}, { locale })} />
{:else}
	{#each groups as group (group.arena?.id ?? 'unplaced')}
		{@const subgroups = trainerGroups(group.arena, group.riders)}
		{@const split =
			subgroups.length > 1 || (group.arena === null && subgroups.some((g) => g.trainer))}
		<section class="group">
			<header>
				<h2>
					{#if group.arena}
						{group.arena.name} · {group.arena.trainer?.name ?? m.board_no_trainer({}, { locale })}
					{:else}
						{m.board_not_placed({}, { locale })}
					{/if}
				</h2>
				<span class="count sj-small">{group.riders.length}</span>
				{#if group.arena && session.editable}
					{@const arena = group.arena}
					<button
						type="button"
						class="sj-btn sj-btn--quiet sj-btn--icon"
						aria-label={m.board_trainer_for({ arena: arena.name }, { locale })}
						onclick={() => ontrainer(arena)}
					>
						<Icon name="person_edit" size={20} />
					</button>
				{/if}
			</header>
			{#if split}
				{#each subgroups as sub (sub.trainer?.id ?? 'none')}
					<h3 class="subgroup sj-small">
						<bdi>{sub.trainer?.name ?? m.board_no_trainer({}, { locale })}</bdi> · {sub.riders
							.length}
					</h3>
					{#each sub.riders as rider (rider.bookingId)}
						{@render row(rider)}
					{/each}
				{/each}
			{:else}
				{#each group.riders as rider (rider.bookingId)}
					{@render row(rider)}
				{/each}
			{/if}
		</section>
	{/each}
{/if}

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
		<span class="sj-avatar" aria-hidden="true">{rider.name.slice(0, 1)}</span>
		<span class="name" dir="auto">{rider.name}</span>
		{#if rider.problems.length > 0}
			<span
				class="problem"
				role="img"
				aria-label={rider.problems.map((p) => problemText(p, locale)).join(' ')}
			>
				<Icon name="warning" size={20} filled />
			</span>
		{/if}
		<span class={['horse', !rider.horse && rider.horseSource === 'school' && 'pick']}>
			{horseLabel(rider)}
		</span>
	</button>
{/snippet}

<style>
	.group {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}
	header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
	}
	h2 {
		margin: 0;
		flex: 1;
		font: 600 0.875rem/1.3 var(--font-display);
		color: var(--ink-muted);
	}
	.count {
		color: var(--ink-muted);
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		inline-size: 100%;
		padding: var(--space-3);
		border: 0;
		border-block-start: 1px solid var(--line);
		background: none;
		color: var(--ink);
		font: inherit;
		text-align: start;
		cursor: pointer;
	}
	.row:hover {
		background: var(--hover-veil);
	}
	.ticked {
		background: var(--accent-soft);
	}
	.subgroup {
		margin: 0;
		padding: var(--space-2) var(--space-3) var(--space-1);
		border-block-start: 1px solid var(--line);
		color: var(--ink-muted);
		font-weight: 600;
	}
	.name {
		flex: 1;
		font-weight: 500;
	}
	.horse {
		font-weight: 600;
	}
	.pick {
		color: var(--accent);
	}
	.problem {
		display: inline-flex;
		color: var(--brass);
	}
</style>
