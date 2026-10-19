<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { localName } from '#lib/academy.js';
	import { api } from '#lib/api/client.js';
	import type {
		BoardRider,
		BoardSession,
		HorsePicker,
		PlacementResult
	} from '#lib/api/board-types.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { Locale } from '#lib/api/types.js';
	import { formatDate } from '#lib/format.js';
	import { defaultArenaFor, horseStateText, problemText } from '#lib/forms/board.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, Icon } from '#lib/ui/index.js';

	type Props = {
		session: BoardSession;
		rider: BoardRider;
		locale: Locale;
		onclose: () => void;
		onsession: (session: BoardSession, unplaceable: string[]) => void;
	};
	let { session, rider, locale, onclose, onsession }: Props = $props();

	const id = $props.id();
	let heading = $state<HTMLElement>();
	let picker = $state<HorsePicker>();
	let horseId = $state<string | null>(null);
	let arenaId = $state<string | null>(null);
	let note = $state('');
	let busy = $state(false);
	let failure = $state('');

	const school = $derived(rider.horseSource === 'school');

	async function loadPicker() {
		picker = await api<HorsePicker>(
			`/board/horses?bookingId=${encodeURIComponent(rider.bookingId)}`
		);
	}

	onMount(async () => {
		horseId = rider.horse?.id ?? null;
		arenaId = rider.arenaId;
		note = rider.note ?? '';
		await tick();
		heading?.focus();
		try {
			await loadPicker();
			arenaId ??= defaultArenaFor(picker!, session);
		} catch (e) {
			failure = errorText(e instanceof ApiError ? e.code : 'internal_error', locale);
		}
	});

	async function save() {
		busy = true;
		failure = '';
		try {
			let next = session;
			let unplaceable: string[] = [];
			if (
				session.editable &&
				(horseId !== (rider.horse?.id ?? null) || arenaId !== rider.arenaId)
			) {
				const result = await api<PlacementResult>(
					`/bookings/${encodeURIComponent(rider.bookingId)}/placement`,
					{ method: 'PUT', body: { horseId, arenaId } }
				);
				next = result.session;
				unplaceable = result.unplaceable;
			}
			if (note.trim() !== (rider.note ?? '')) {
				await api(`/bookings/${encodeURIComponent(rider.bookingId)}/note`, {
					method: 'PUT',
					body: { body: note.trim() }
				});
				next = {
					...next,
					riders: next.riders.map((r) =>
						r.bookingId === rider.bookingId ? { ...r, note: note.trim() || null } : r
					)
				};
			}
			onsession(next, unplaceable);
			onclose();
		} catch (e) {
			failure = errorText(e instanceof ApiError ? e.code : 'internal_error', locale);
			if (e instanceof ApiError && e.status === 409) await loadPicker().catch(() => {});
		} finally {
			busy = false;
		}
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') onclose();
	}
</script>

<svelte:window {onkeydown} />

<div class="scrim" aria-hidden="true" onclick={onclose}></div>
<div class="sheet" role="dialog" aria-modal="true" aria-labelledby={id}>
	<header>
		<h2 class="sj-heading" {id} tabindex="-1" bind:this={heading}>
			{rider.name}
			<span class="sj-small sj-muted" dir="ltr">{session.start}</span>
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

	<div class="body sj-stack">
		{#if rider.level}<p class="sj-small sj-muted">{localName(rider.level, locale)}</p>{/if}
		{#each rider.problems as problem (problem)}
			<Banner tone="pending" icon="warning">{problemText(problem, locale)}</Banner>
		{/each}
		{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
		{#if !session.editable}
			<Banner tone="pending" icon="info">{m.board_past_note_only({}, { locale })}</Banner>
		{/if}

		<section class="sj-stack">
			<h3 class="label">{m.board_history({}, { locale })}</h3>
			{#if picker && picker.history.length === 0}
				<p class="sj-small sj-muted">{m.board_no_history({}, { locale })}</p>
			{/if}
			{#each picker?.history ?? [] as ride (ride.bookingId)}
				<div class="ride">
					<span class="sj-small"
						>{formatDate(`${ride.date}T00:00:00Z`, locale)} ·
						<strong>{ride.horseName ?? m.board_no_horse({}, { locale })}</strong>
						{#if ride.arenaName}· {ride.arenaName}{/if}
						{#if ride.trainerName}· {ride.trainerName}{/if}</span
					>
					{#if ride.note}<p class="note" dir="auto">{ride.note}</p>{/if}
				</div>
			{/each}
		</section>

		{#if session.editable}
			{#if school}
				<fieldset class="sj-stack">
					<legend class="label">{m.board_horse({}, { locale })}</legend>
					{#each picker?.horses ?? [] as horse (horse.id)}
						{@const usable = horse.state === 'free' || horse.state === 'current'}
						<label class={['choice', !usable && 'off']}>
							<input
								type="radio"
								name="horse"
								value={horse.id}
								bind:group={horseId}
								disabled={!usable}
							/>
							<span class="main">
								<strong>{horse.name}</strong>
								{#if horse.notes}<span class="sj-small sj-muted" dir="auto">{horse.notes}</span
									>{/if}
							</span>
							<span class="sj-small state">{horseStateText(horse, locale)}</span>
						</label>
					{/each}
				</fieldset>
			{:else}
				<p>{m.board_own_horse({ name: rider.ownHorseName ?? '' }, { locale })}</p>
			{/if}

			<fieldset class="sj-stack">
				<legend class="label">{m.board_arena({}, { locale })}</legend>
				{#each session.arenas as arena (arena.id)}
					{@const full = arena.placesLeft === 0 && arena.id !== rider.arenaId}
					<label class={['choice', full && 'off']}>
						<input
							type="radio"
							name="arena"
							value={arena.id}
							bind:group={arenaId}
							disabled={full}
						/>
						<span class="main"><strong>{arena.name}</strong></span>
						<span class="sj-small state"
							>{m.board_places_left({ count: arena.placesLeft }, { locale })}</span
						>
					</label>
				{/each}
			</fieldset>
		{/if}

		<label class="sj-field">
			<span class="sj-label">{m.board_note({}, { locale })}</span>
			<textarea class="sj-input" rows="3" maxlength="500" dir="auto" bind:value={note}></textarea>
			<span class="sj-hint">{m.board_note_hint({}, { locale })}</span>
		</label>
	</div>

	<footer>
		<Button block disabled={busy} onclick={save}>{m.board_save({}, { locale })}</Button>
	</footer>
</div>

<style>
	.scrim {
		position: fixed;
		inset: 0;
		background: var(--scrim);
		z-index: 40;
	}
	.sheet {
		position: fixed;
		inset: 0;
		z-index: 41;
		display: flex;
		flex-direction: column;
		background: var(--ground);
	}
	@media (min-width: 720px) {
		.sheet {
			inset-inline-start: auto;
			inline-size: 420px;
			box-shadow: var(--shadow-raised);
		}
	}
	header,
	footer {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3);
		background: var(--surface);
	}
	header {
		border-block-end: 1px solid var(--line);
	}
	footer {
		border-block-start: 1px solid var(--line);
	}
	h2 {
		flex: 1;
		margin: 0;
	}
	.body {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-3);
	}
	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
	}
	.label {
		margin: 0;
		font: 600 0.875rem/1.3 var(--font-display);
		color: var(--ink-muted);
	}
	.ride {
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		background: var(--surface);
		border: 1px solid var(--line);
	}
	.note {
		margin: var(--space-1) 0 0;
	}
	.choice {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		background: var(--surface);
		border: 1px solid var(--line);
		cursor: pointer;
	}
	.choice:has(input:checked) {
		border-color: var(--accent);
		box-shadow: inset 0 0 0 1px var(--accent);
	}
	.choice.off {
		opacity: 0.6;
		cursor: default;
	}
	.main {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	.state {
		color: var(--ink-muted);
	}
	textarea {
		resize: vertical;
	}
</style>
