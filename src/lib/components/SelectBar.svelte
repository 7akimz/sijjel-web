<script lang="ts">
	import { api } from '#lib/api/client.js';
	import type { BoardSession } from '#lib/api/board-types.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { Locale } from '#lib/api/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner } from '#lib/ui/index.js';

	type Props = {
		session: BoardSession;
		selected: string[];
		locale: Locale;
		onsession: (session: BoardSession) => void;
		ondone: () => void;
	};
	let { session, selected, locale, onsession, ondone }: Props = $props();

	let choosing = $state(false);
	let busy = $state(false);
	let failure = $state('');

	async function give(trainerId: string | null) {
		busy = true;
		failure = '';
		try {
			onsession(
				await api<BoardSession>('/board/riders/trainer', {
					method: 'PUT',
					body: { bookingIds: selected, trainerId }
				})
			);
			ondone();
		} catch (e) {
			failure = errorText(e instanceof ApiError ? e.code : 'internal_error', locale);
		} finally {
			busy = false;
		}
	}
</script>

<div class="bar sj-stack" role="region" aria-label={m.board_set_trainer({}, { locale })}>
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
	{#if choosing}
		<ul role="list">
			{#each session.staff as person (person.id)}
				<li>
					<button type="button" class="option" disabled={busy} onclick={() => give(person.id)}
						>{person.name}</button
					>
				</li>
			{/each}
			<li>
				<button type="button" class="option" disabled={busy} onclick={() => give(null)}
					>{m.board_same_as_arena({}, { locale })}</button
				>
			</li>
		</ul>
	{/if}
	<div class="actions">
		<span class="count">{m.board_selected_count({ count: selected.length }, { locale })}</span>
		<button
			type="button"
			class="sj-btn sj-btn--primary"
			disabled={selected.length === 0 || busy}
			aria-expanded={choosing}
			onclick={() => (choosing = !choosing)}>{m.board_set_trainer({}, { locale })}</button
		>
		<button type="button" class="sj-btn sj-btn--quiet" onclick={ondone}
			>{m.board_select_done({}, { locale })}</button
		>
	</div>
</div>

<style>
	.bar {
		position: sticky;
		inset-block-end: var(--space-3);
		z-index: 30;
		padding: var(--space-3);
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-raised);
	}
	.actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	.count {
		flex: 1;
		font-weight: 600;
	}
	ul {
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.option {
		inline-size: 100%;
		padding: var(--space-3);
		border-radius: var(--radius-md);
		border: 1px solid var(--line);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		text-align: start;
		cursor: pointer;
	}
</style>
