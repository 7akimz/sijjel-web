<script lang="ts">
	import { api } from '#lib/api/client.js';
	import type { BoardSession } from '#lib/api/board-types.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { Locale } from '#lib/api/types.js';
	import { riderCountText } from '#lib/forms/subscription.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Button } from '#lib/ui/index.js';

	type Props = {
		session: BoardSession;
		locale: Locale;
		onsession: (session: BoardSession) => void;
		/** What happened, for the board to show above the riders. */
		onnotice: (text: string, tone: 'done' | 'failure') => void;
	};
	let { session, locale, onsession, onnotice }: Props = $props();

	let busy = $state(false);

	const waiting = (s: BoardSession) =>
		s.riders.filter((r) => r.horseSource === 'school' && !r.horse).length;

	async function suggest() {
		if (busy) return;
		busy = true;
		try {
			const before = waiting(session);
			const next = await api<BoardSession>('/board/suggest', {
				method: 'POST',
				body: { date: session.date, start: session.start }
			});
			const placed = before - waiting(next);
			const message =
				placed > 0
					? m.board_suggest_done(
							{ count: placed, riders: riderCountText(placed, locale) },
							{ locale }
						)
					: m.board_suggest_none({}, { locale });
			onsession(next);
			onnotice(message, 'done');
		} catch (e) {
			onnotice(errorText(e instanceof ApiError ? e.code : 'internal_error', locale), 'failure');
		} finally {
			busy = false;
		}
	}
</script>

{#if session.editable && waiting(session) > 0}
	<Button variant="quiet" icon="auto_awesome" disabled={busy} onclick={suggest}
		>{m.board_suggest({}, { locale })}</Button
	>
{/if}
