<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { api } from '#lib/api/client.js';
	import type { BoardArena, BoardSession } from '#lib/api/board-types.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { Locale } from '#lib/api/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Icon } from '#lib/ui/index.js';

	type Props = {
		session: BoardSession;
		arena: BoardArena;
		locale: Locale;
		onclose: () => void;
		onsession: (session: BoardSession) => void;
	};
	let { session, arena, locale, onclose, onsession }: Props = $props();

	const id = $props.id();
	let heading = $state<HTMLElement>();
	let busy = $state(false);
	let failure = $state('');

	onMount(async () => {
		await tick();
		heading?.focus();
	});

	async function choose(trainerId: string | null) {
		busy = true;
		failure = '';
		try {
			onsession(
				await api<BoardSession>('/board/trainer', {
					method: 'PUT',
					body: { date: session.date, start: session.start, arenaId: arena.id, trainerId }
				})
			);
		} catch (e) {
			failure = errorText(e instanceof ApiError ? e.code : 'internal_error', locale);
		} finally {
			busy = false;
		}
	}
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<div class="scrim" aria-hidden="true" onclick={onclose}></div>
<div class="picker sj-stack" role="dialog" aria-modal="true" aria-labelledby={id}>
	<header>
		<h2 class="sj-heading" {id} tabindex="-1" bind:this={heading}>
			{m.board_trainer_for({ arena: arena.name }, { locale })}
		</h2>
		<button
			type="button"
			class="sj-btn sj-btn--quiet sj-btn--icon"
			aria-label={m.board_close({}, { locale })}
			onclick={onclose}
		>
			<Icon name="close" />
		</button>
	</header>
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
	<ul role="list">
		{#each session.staff as person (person.id)}
			<li>
				<button
					type="button"
					class="option"
					aria-pressed={arena.trainer?.id === person.id}
					disabled={busy}
					onclick={() => choose(person.id)}>{person.name}</button
				>
			</li>
		{/each}
		<li>
			<button
				type="button"
				class="option"
				aria-pressed={arena.trainer === null}
				disabled={busy}
				onclick={() => choose(null)}>{m.board_no_trainer({}, { locale })}</button
			>
		</li>
	</ul>
</div>

<style>
	.scrim {
		position: fixed;
		inset: 0;
		background: var(--scrim);
		z-index: 40;
	}
	.picker {
		position: fixed;
		inset-inline: 0;
		inset-block-end: 0;
		z-index: 41;
		max-block-size: 80vh;
		overflow-y: auto;
		padding: var(--space-3);
		background: var(--surface);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		box-shadow: var(--shadow-raised);
	}
	@media (min-width: 720px) {
		.picker {
			inset: auto;
			inset-block-start: 20vh;
			inset-inline-start: calc(50% - 180px);
			inline-size: 360px;
			border-radius: var(--radius-lg);
		}
	}
	header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	h2 {
		flex: 1;
		margin: 0;
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
	.option[aria-pressed='true'] {
		border-color: var(--accent);
		box-shadow: inset 0 0 0 1px var(--accent);
		font-weight: 600;
	}
</style>
