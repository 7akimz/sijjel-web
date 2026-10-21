import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { BoardSession } from '#lib/api/board-types.js';
import SuggestHorses from './SuggestHorses.svelte';
import TrainerPicker from './TrainerPicker.svelte';

const session: BoardSession = {
	date: '2026-10-19',
	start: '18:00',
	end: '18:30',
	editable: true,
	times: [],
	arenas: [{ id: 'main', name: 'Main arena', capacity: 2, placesLeft: 2, trainer: null }],
	staff: [
		{ id: 'ahmed', name: 'Ahmed' },
		{ id: 'omar', name: 'Omar' }
	],
	riders: [
		{
			bookingId: 'b',
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
};

function stubFetch(delay = 0) {
	const bodies: { url: string; body: unknown }[] = [];
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string, init: RequestInit = {}) => {
			bodies.push({ url, body: init.body ? JSON.parse(String(init.body)) : undefined });
			await new Promise((resolve) => setTimeout(resolve, delay));
			return Response.json(session);
		})
	);
	return bodies;
}

afterEach(() => vi.unstubAllGlobals());

describe('TrainerPicker', () => {
	it('sets a staff member, or no trainer, for the arena in this session', async () => {
		const bodies = stubFetch();
		const onsession = vi.fn();
		const screen = render(TrainerPicker, {
			session,
			arena: session.arenas[0],
			locale: 'en',
			onclose: () => {},
			onsession
		});

		await expect.element(screen.getByRole('button', { name: 'Ahmed' })).toBeVisible();
		await screen.getByRole('button', { name: 'Omar' }).click();
		await vi.waitFor(() => expect(onsession).toHaveBeenCalledOnce());
		expect(bodies[0]).toEqual({
			url: '/api/board/trainer',
			body: { date: '2026-10-19', start: '18:00', arenaId: 'main', trainerId: 'omar' }
		});

		await screen.getByRole('button', { name: 'No trainer' }).click();
		await vi.waitFor(() => expect(bodies).toHaveLength(2));
		expect(bodies[1].body).toMatchObject({ trainerId: null });
	});
});

describe('SuggestHorses', () => {
	it('sends one request however fast it is tapped', async () => {
		const bodies = stubFetch(200);
		const screen = render(SuggestHorses, { session, locale: 'en', onsession: () => {} });
		const button = screen.getByRole('button', { name: 'Suggest horses' });

		await button.click();
		await expect.element(button).toBeDisabled();
		await button.click({ force: true });

		await vi.waitFor(() => expect(button).toBeEnabled());
		expect(bodies.filter((b) => b.url === '/api/board/suggest')).toHaveLength(1);
	});
});
