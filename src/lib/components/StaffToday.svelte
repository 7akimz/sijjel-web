<script lang="ts">
	import { resolve } from '$app/paths';
	import type { BoardSession } from '#lib/api/board-types.js';
	import { daySummary } from '#lib/forms/home.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Card, EmptyState, Icon } from '#lib/ui/index.js';

	let {
		board,
		setupDone,
		admin
	}: { board: BoardSession | null; setupDone: boolean; admin: boolean } = $props();

	const summary = $derived(board ? daySummary(board.times) : null);
</script>

{#if !setupDone}
	{#if !admin}
		<EmptyState icon="construction" title={m.home_staff_setup_title()}>
			{m.home_staff_setup_body()}
		</EmptyState>
	{/if}
{:else if board && summary}
	<Card raised>
		<div class="today sj-stack">
			<h2 class="sj-heading">{m.home_today()}</h2>
			{#if summary.sessions.length === 0}
				<p class="sj-muted">{m.home_today_none()}</p>
			{:else}
				<dl class="stats">
					<div>
						<dt class="sj-small sj-muted">{m.home_today_sessions()}</dt>
						<dd data-testid="today-sessions">{summary.sessions.length}</dd>
					</div>
					<div>
						<dt class="sj-small sj-muted">{m.home_today_riders()}</dt>
						<dd data-testid="today-riders">{summary.riders}</dd>
					</div>
					<div>
						<dt class="sj-small sj-muted">{m.home_today_unplaced()}</dt>
						<dd data-testid="today-unplaced">{summary.unplaced}</dd>
					</div>
				</dl>
				{#if summary.attention > 0}
					<Banner tone="pending" icon="warning">
						{m.home_today_attention({ count: summary.attention })}
					</Banner>
				{/if}
				<ul class="sessions" role="list">
					{#each summary.sessions as session (session.start)}
						<li>
							<a
								class="session"
								href={resolve(`/(academy)/(staff)/board?date=${board.date}&start=${session.start}`)}
							>
								<span class="time" dir="ltr">{session.start} – {session.end}</span>
								<span class="sj-small sj-muted">
									{m.home_today_session_riders({ count: session.riders })}
									{#if session.unplaced > 0}
										· {m.home_today_session_unplaced({ count: session.unplaced })}
									{/if}
								</span>
								{#if session.hasProblem}
									<span class="problem"
										><Icon name="warning" size={20} /><span class="sj-visually-hidden"
											>{m.home_today_session_problem()}</span
										></span
									>
								{/if}
								<Icon name="chevron_right" directional />
							</a>
						</li>
					{/each}
				</ul>
			{/if}
			<div class="actions">
				<Button href={resolve('/(academy)/(staff)/board')}>{m.home_open_board()}</Button>
				{#if admin}
					<Button
						variant="secondary"
						icon="person_add"
						href={resolve('/(academy)/(admin)/members/invite')}
					>
						{m.members_invite()}
					</Button>
				{/if}
			</div>
		</div>
	</Card>
{/if}

<style>
	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-3);
		margin: 0;
	}
	.stats dd {
		margin: 0;
		font: 600 24px/32px var(--font-display);
	}
	.sessions {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.sessions li + li {
		border-block-start: 1px solid var(--line);
	}
	.session {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-block-size: 48px;
		color: inherit;
		text-decoration: none;
	}
	.time {
		font-weight: 600;
	}
	.session .sj-small {
		flex: 1;
	}
	.problem {
		display: inline-flex;
		color: var(--danger);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
</style>
