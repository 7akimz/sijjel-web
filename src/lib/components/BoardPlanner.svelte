<script lang="ts">
	import { untrack } from 'svelte';
	import BoardSessionView from '#lib/components/BoardSession.svelte';
	import RiderSheet from '#lib/components/RiderSheet.svelte';
	import SelectBar from '#lib/components/SelectBar.svelte';
	import SuggestHorses from '#lib/components/SuggestHorses.svelte';
	import TrainerPicker from '#lib/components/TrainerPicker.svelte';
	import type { BoardArena, BoardRider, BoardSession } from '#lib/api/board-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { groupByArena } from '#lib/forms/board.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner } from '#lib/ui/index.js';

	type Props = {
		session: BoardSession;
		locale: Locale;
		onsession: (session: BoardSession) => void;
		/** Whether riders are being ticked for a shared change; the page offers the switch. */
		selecting?: boolean;
	};
	let { session, locale, onsession, selecting = $bindable(false) }: Props = $props();

	let rider = $state<BoardRider | null>(null);
	let trainerArena = $state<BoardArena | null>(null);
	let notice = $state('');
	let failure = $state('');
	let unplaceable = $state<string[]>([]);
	let selected = $state<string[]>([]);

	// Sheets, notices and warnings belong to one session; moving to another day or time, including
	// with the browser's back button, closes and clears them.
	const sessionKey = $derived(`${session.date} ${session.start}`);
	let shownKey = untrack(() => sessionKey);
	$effect.pre(() => {
		if (sessionKey === shownKey) return;
		shownKey = sessionKey;
		untrack(() => {
			rider = trainerArena = null;
			notice = failure = '';
			unplaceable = [];
			selecting = false;
			selected = [];
		});
	});

	function toggle(bookingId: string) {
		selected = selected.includes(bookingId)
			? selected.filter((id) => id !== bookingId)
			: [...selected, bookingId];
	}

	function stopSelecting() {
		selecting = false;
		selected = [];
	}

	const hasUnplaced = $derived(groupByArena(session)[0]?.arena === null);
	const needsHorse = $derived(
		session.editable && session.riders.some((r) => r.horseSource === 'school' && !r.horse)
	);

	function showNotice(text: string, tone: 'done' | 'failure') {
		notice = tone === 'done' ? text : '';
		failure = tone === 'failure' ? text : '';
	}

	function applySession(next: BoardSession, stranded: string[], saved: boolean) {
		onsession(next);
		if (saved) {
			unplaceable = stranded;
			notice = m.board_saved({}, { locale });
		}
	}
</script>

{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}
{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
{#if unplaceable.length > 0}
	<Banner tone="pending" icon="warning"
		>{m.board_unplaceable({ names: unplaceable.join(', ') }, { locale })}</Banner
	>
{/if}
{#if needsHorse && !hasUnplaced && !selecting}
	<div><SuggestHorses {session} {locale} {onsession} onnotice={showNotice} /></div>
{/if}
<BoardSessionView
	{session}
	{locale}
	onrider={(r) => {
		notice = '';
		rider = r;
	}}
	ontrainer={(a) => {
		notice = '';
		trainerArena = a;
	}}
	{selecting}
	{selected}
	ontoggle={toggle}
>
	{#snippet waitingAction()}
		{#if !selecting}<SuggestHorses {session} {locale} {onsession} onnotice={showNotice} />{/if}
	{/snippet}
</BoardSessionView>
{#if selecting}
	<SelectBar {session} {selected} {locale} {onsession} ondone={stopSelecting} />
{/if}
{#if rider}
	<RiderSheet {session} {rider} {locale} onclose={() => (rider = null)} onsession={applySession} />
{/if}
{#if trainerArena}
	<TrainerPicker
		{session}
		arena={trainerArena}
		{locale}
		onclose={() => (trainerArena = null)}
		onsession={(next) => {
			onsession(next);
			trainerArena = null;
		}}
	/>
{/if}
