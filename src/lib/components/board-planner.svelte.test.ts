import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { BoardSession } from '#lib/api/board-types.js';
import BoardPlanner from './BoardPlanner.svelte';

const session = (start: string): BoardSession => ({
	date: '2026-10-19',
	start,
	end: '18:30',
	editable: true,
	times: [],
	arenas: [],
	staff: [],
	riders: [
		{
			bookingId: `b-${start}`,
			memberId: 'm',
			name: 'Sara',
			level: null,
			horseSource: 'school',
			horse: null,
			ownHorseName: null,
			arenaId: null,
			note: null,
			problems: [],
			trainer: null
		}
	]
});

afterEach(() => vi.unstubAllGlobals());

describe('BoardPlanner', () => {
	it('closes an open rider sheet when the session changes', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () =>
				Response.json({
					rider: { memberId: 'm', name: 'Sara', level: null, weightKg: null },
					history: [],
					horses: []
				})
			)
		);
		const screen = render(BoardPlanner, {
			session: session('18:00'),
			locale: 'en',
			onsession: () => {}
		});
		await screen.getByRole('button', { name: /Sara/ }).click();
		await expect.element(screen.getByRole('dialog')).toBeVisible();

		await screen.rerender({ session: session('17:30'), locale: 'en', onsession: () => {} });

		await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
	});

	it('keeps the saved notice when a save returns the same session', async () => {
		const picker = {
			rider: { memberId: 'm', name: 'Sara', level: null, weightKg: null },
			history: [],
			horses: []
		};
		vi.stubGlobal(
			'fetch',
			vi.fn(async (url: string) =>
				url.endsWith('/note') ? new Response(null, { status: 204 }) : Response.json(picker)
			)
		);
		let current = session('18:00');
		const screen = render(BoardPlanner, {
			session: current,
			locale: 'en',
			onsession: (next: BoardSession) => {
				current = next;
				queueMicrotask(() =>
					screen.rerender({ session: { ...next }, locale: 'en', onsession: () => {} })
				);
			}
		});
		await screen.getByRole('button', { name: /Sara/ }).click();
		await screen.getByLabelText('Note on this ride').fill('Good trot');
		await screen.getByRole('button', { name: 'Save' }).click();

		await expect.element(screen.getByText('Saved.')).toBeVisible();
	});
});
