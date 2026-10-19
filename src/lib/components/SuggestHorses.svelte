<script lang="ts">
	import { api } from '#lib/api/client.js';
	import type { BoardSession } from '#lib/api/board-types.js';
	import { ApiError, errorText } from '#lib/api/errors.js';
	import type { Locale } from '#lib/api/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button } from '#lib/ui/index.js';

	type Props = {
		session: BoardSession;
		locale: Locale;
		onsession: (session: BoardSession) => void;
	};
	let { session, locale, onsession }: Props = $props();

	let busy = $state(false);
	let message = $state('');
	let failure = $state('');

	const waiting = (s: BoardSession) =>
		s.riders.filter((r) => r.horseSource === 'school' && !r.horse).length;

	async function suggest() {
		if (busy) return;
		busy = true;
		message = failure = '';
		try {
			const before = waiting(session);
			const next = await api<BoardSession>('/board/suggest', {
				method: 'POST',
				body: { date: session.date, start: session.start }
			});
			const placed = before - waiting(next);
			message =
				placed > 0
					? m.board_suggest_done({ count: placed }, { locale })
					: m.board_suggest_none({}, { locale });
			onsession(next);
		} catch (e) {
			failure = errorText(e instanceof ApiError ? e.code : 'internal_error', locale);
		} finally {
			busy = false;
		}
	}
</script>

{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
{#if message}<Banner icon="check_circle">{message}</Banner>{/if}
{#if session.editable && waiting(session) > 0}
	<div>
		<Button variant="secondary" icon="auto_awesome" disabled={busy} onclick={suggest}
			>{m.board_suggest({}, { locale })}</Button
		>
	</div>
{/if}
