<script lang="ts">
	import { untrack } from 'svelte';
	import BoardSessionView from '#lib/components/BoardSession.svelte';
	import RiderSheet from '#lib/components/RiderSheet.svelte';
	import SuggestHorses from '#lib/components/SuggestHorses.svelte';
	import TrainerPicker from '#lib/components/TrainerPicker.svelte';
	import type { BoardArena, BoardRider, BoardSession } from '#lib/api/board-types.js';
	import type { Locale } from '#lib/api/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner } from '#lib/ui/index.js';

	type Props = {
		session: BoardSession;
		locale: Locale;
		onsession: (session: BoardSession) => void;
	};
	let { session, locale, onsession }: Props = $props();

	let rider = $state<BoardRider | null>(null);
	let trainerArena = $state<BoardArena | null>(null);
	let notice = $state('');
	let unplaceable = $state<string[]>([]);

	// Sheets, notices and warnings belong to one session; moving to another day or time, including
	// with the browser's back button, closes and clears them.
	const sessionKey = $derived(`${session.date} ${session.start}`);
	$effect.pre(() => {
		void sessionKey;
		untrack(() => {
			rider = trainerArena = null;
			notice = '';
			unplaceable = [];
		});
	});

	function applySession(next: BoardSession, stranded: string[], saved: boolean) {
		onsession(next);
		if (saved) {
			unplaceable = stranded;
			notice = m.board_saved({}, { locale });
		}
	}
</script>

<SuggestHorses {session} {locale} {onsession} />
{#if notice}<Banner icon="check_circle">{notice}</Banner>{/if}
{#if unplaceable.length > 0}
	<Banner tone="pending" icon="warning"
		>{m.board_unplaceable({ names: unplaceable.join(', ') }, { locale })}</Banner
	>
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
/>
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
