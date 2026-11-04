import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { BoardRider, BoardSession } from '#lib/api/board-types.js';
import SuggestHorses from './SuggestHorses.svelte';

afterEach(() => vi.unstubAllGlobals());

const rider = (name: string, horse: BoardRider['horse'] = null): BoardRider => ({
	bookingId: name,
	memberId: name,
	name,
	level: null,
	horseSource: 'school',
	horse,
	ownHorseName: null,
	arenaId: null,
	note: null,
	problems: [],
	trainer: null
});

const session = (riders: BoardRider[]): BoardSession => ({
	date: '2026-11-04',
	start: '17:00',
	end: '18:00',
	editable: true,
	times: [],
	arenas: [],
	staff: [],
	riders
});

async function suggestFor(names: string[], locale: 'en' | 'ar' = 'en') {
	const after = session(names.map((n) => rider(n, { id: n, name: `Horse ${n}` })));
	vi.stubGlobal(
		'fetch',
		vi.fn(async () => Response.json(after))
	);
	const screen = render(SuggestHorses, {
		session: session(names.map((n) => rider(n))),
		locale,
		onsession: vi.fn()
	});
	await screen.getByRole('button').click();
	return screen;
}

describe('SuggestHorses', () => {
	it('says one rider in the singular', async () => {
		const screen = await suggestFor(['Layla']);

		await expect.element(screen.getByText('Horses suggested for 1 rider.')).toBeVisible();
	});

	it('counts several riders', async () => {
		const screen = await suggestFor(['Layla', 'Sara', 'Omar']);

		await expect.element(screen.getByText('Horses suggested for 3 riders.')).toBeVisible();
	});

	it('keeps the Arabic sentence that suits any number', async () => {
		const screen = await suggestFor(['Layla', 'Sara'], 'ar');

		await expect.element(screen.getByText('تم اقتراح خيول لـ 2 من الفرسان.')).toBeVisible();
	});
});
