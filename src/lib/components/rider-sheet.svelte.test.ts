import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { BoardRider, BoardSession, HorsePicker } from '#lib/api/board-types.js';
import RiderSheet from './RiderSheet.svelte';

const sara: BoardRider = {
	bookingId: 'b-sara',
	memberId: 'm-sara',
	name: 'Sara',
	level: { nameEn: 'Intro', nameAr: 'تمهيدي' },
	horseSource: 'school',
	horse: null,
	ownHorseName: null,
	arenaId: null,
	note: null,
	problems: [],
	trainer: null
};

const session = (editable = true): BoardSession => ({
	date: '2026-10-19',
	start: '18:00',
	end: '18:30',
	editable,
	times: [],
	arenas: [
		{ id: 'main', name: 'Main arena', capacity: 2, placesLeft: 0, trainer: null },
		{ id: 'side', name: 'Side arena', capacity: 2, placesLeft: 2, trainer: null }
	],
	staff: [],
	riders: [sara]
});

const picker: HorsePicker = {
	rider: { memberId: 'm-sara', name: 'Sara', level: null, weightKg: null },
	history: [
		{
			bookingId: 'old',
			date: '2026-10-17',
			start: '18:00',
			horseName: 'Badr',
			arenaId: 'side',
			arenaName: 'Side arena',
			trainerName: 'Ahmed',
			note: 'Losing her stirrups in rising trot'
		}
	],
	horses: [
		{
			id: 'badr',
			name: 'Badr',
			notes: 'Steady',
			state: 'free',
			takenBy: null,
			usedToday: 1,
			maxPerDay: 3
		},
		{
			id: 'zahra',
			name: 'Zahra',
			notes: null,
			state: 'taken',
			takenBy: 'Layla',
			usedToday: 2,
			maxPerDay: 3
		}
	]
};

type Call = { method: string; url: string; body: unknown };

function stubApi(
	placement: () => Response,
	note: () => Response = () => new Response(null, { status: 204 })
) {
	const calls: Call[] = [];
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string, init: RequestInit = {}) => {
			const method = init.method ?? 'GET';
			calls.push({ method, url, body: init.body ? JSON.parse(String(init.body)) : undefined });
			if (url.startsWith('/api/board/horses')) return Response.json(picker);
			if (url.startsWith('/api/board?')) return Response.json(session());
			if (url.endsWith('/placement')) return placement();
			return note();
		})
	);
	return calls;
}

afterEach(() => vi.unstubAllGlobals());

const placed = () =>
	Response.json({
		session: {
			...session(),
			riders: [{ ...sara, horse: { id: 'badr', name: 'Badr' }, arenaId: 'side' }]
		},
		unplaceable: []
	});

describe('RiderSheet', () => {
	it('shows the rider history and only offers horses that can take them', async () => {
		stubApi(placed);
		const screen = render(RiderSheet, {
			session: session(),
			rider: sara,
			locale: 'en',
			onclose: () => {},
			onsession: () => {}
		});

		await expect.element(screen.getByText('Losing her stirrups in rising trot')).toBeVisible();
		await expect.element(screen.getByText('With Layla')).toBeVisible();
		await expect.element(screen.getByRole('radio', { name: /Zahra/ })).toBeDisabled();
		await expect.element(screen.getByRole('radio', { name: /Badr/ })).toBeEnabled();
	});

	it('places the rider on the chosen horse in the arena from their last ride', async () => {
		const calls = stubApi(placed);
		const onsession = vi.fn();
		const screen = render(RiderSheet, {
			session: session(),
			rider: sara,
			locale: 'en',
			onclose: () => {},
			onsession
		});

		await screen.getByRole('radio', { name: /Badr/ }).click();
		await screen.getByRole('button', { name: 'Save' }).click();

		await vi.waitFor(() => expect(onsession).toHaveBeenCalled());
		expect(calls.find((c) => c.url.endsWith('/placement'))?.body).toEqual({
			horseId: 'badr',
			arenaId: 'side'
		});
	});

	it('explains a refused placement and refreshes the horses', async () => {
		const calls = stubApi(() => Response.json({ code: 'horse_taken' }, { status: 409 }));
		const screen = render(RiderSheet, {
			session: session(),
			rider: sara,
			locale: 'en',
			onclose: () => {},
			onsession: () => {}
		});

		await screen.getByRole('radio', { name: /Badr/ }).click();
		await screen.getByRole('button', { name: 'Save' }).click();

		await expect
			.element(screen.getByText('That horse was just given to someone else.'))
			.toBeVisible();
		await vi.waitFor(() =>
			expect(calls.filter((c) => c.url.startsWith('/api/board/horses'))).toHaveLength(2)
		);
	});

	it('only takes a note on a session that is over', async () => {
		const calls = stubApi(placed);
		const screen = render(RiderSheet, {
			session: session(false),
			rider: sara,
			locale: 'en',
			onclose: () => {},
			onsession: () => {}
		});

		await expect
			.element(screen.getByText('This session is over. You can still add a note.'))
			.toBeVisible();
		expect(screen.container.querySelectorAll('input[type="radio"]')).toHaveLength(0);
		await screen.getByLabelText('Note on this ride').fill('Good canter');
		await screen.getByRole('button', { name: 'Save' }).click();

		await vi.waitFor(() => expect(calls.some((c) => c.url.endsWith('/note'))).toBe(true));
		expect(calls.some((c) => c.url.endsWith('/placement'))).toBe(false);
		expect(calls.find((c) => c.url.endsWith('/note'))?.body).toEqual({ body: 'Good canter' });
	});

	it('refreshes the board after a refused placement and drops the refused horse', async () => {
		const calls = stubApi(() => Response.json({ code: 'horse_taken' }, { status: 409 }));
		const onsession = vi.fn();
		const screen = render(RiderSheet, {
			session: session(),
			rider: sara,
			locale: 'en',
			onclose: () => {},
			onsession
		});

		await screen.getByRole('radio', { name: /Badr/ }).click();
		await screen.getByRole('button', { name: 'Save' }).click();

		await vi.waitFor(() =>
			expect(
				calls.some((c) =>
					decodeURIComponent(c.url).startsWith('/api/board?date=2026-10-19&start=18:00')
				)
			).toBe(true)
		);
		await vi.waitFor(() => expect(onsession).toHaveBeenCalled());
		await expect.element(screen.getByRole('dialog')).toBeVisible();
	});

	it('keeps the saved placement on the board when the note then fails', async () => {
		stubApi(placed, () => Response.json({ code: 'internal_error' }, { status: 500 }));
		const onsession = vi.fn();
		const screen = render(RiderSheet, {
			session: session(),
			rider: sara,
			locale: 'en',
			onclose: () => {},
			onsession
		});

		await screen.getByRole('radio', { name: /Badr/ }).click();
		await screen.getByLabelText('Note on this ride').fill('Steady trot');
		await screen.getByRole('button', { name: 'Save' }).click();

		await vi.waitFor(() => expect(onsession).toHaveBeenCalled());
		expect(onsession.mock.calls[0][0].riders[0].horse).toEqual({ id: 'badr', name: 'Badr' });
	});

	it('can take a placed rider back off their horse and arena', async () => {
		const calls = stubApi(placed);
		const placedSara = { ...sara, horse: { id: 'badr', name: 'Badr' }, arenaId: 'side' };
		const screen = render(RiderSheet, {
			session: session(),
			rider: placedSara,
			locale: 'en',
			onclose: () => {},
			onsession: () => {}
		});

		await screen.getByRole('radio', { name: 'No horse yet' }).click();
		await screen.getByRole('radio', { name: 'No arena yet' }).click();
		await screen.getByRole('button', { name: 'Save' }).click();

		await vi.waitFor(() => expect(calls.some((c) => c.url.endsWith('/placement'))).toBe(true));
		expect(calls.find((c) => c.url.endsWith('/placement'))?.body).toEqual({
			horseId: null,
			arenaId: null
		});
	});

	it('gives the rider their own trainer', async () => {
		const calls = stubApi(placed);
		vi.mocked(fetch).mockImplementation(async (input, init = {}) => {
			const url = String(input);
			calls.push({
				method: init.method ?? 'GET',
				url,
				body: init.body ? JSON.parse(String(init.body)) : undefined
			});
			if (url.startsWith('/api/board/horses')) return Response.json(picker);
			return Response.json(session());
		});
		const onsession = vi.fn();
		const staffed = {
			...session(),
			staff: [
				{ id: 'o', name: 'Omar' },
				{ id: 'a', name: 'Ahmed' }
			]
		};
		const screen = render(RiderSheet, {
			session: staffed,
			rider: { ...sara, trainer: { id: 'a', name: 'Ahmed' } },
			locale: 'en',
			onclose: () => {},
			onsession
		});

		const trainer = screen.getByRole('combobox', { name: 'Trainer' });
		await expect.element(trainer).toHaveValue('a');
		await trainer.selectOptions('Omar');
		await screen.getByRole('button', { name: 'Save' }).click();

		await vi.waitFor(() => expect(onsession).toHaveBeenCalled());
		expect(calls.find((c) => c.url === '/api/board/riders/trainer')?.body).toEqual({
			bookingIds: ['b-sara'],
			trainerId: 'o'
		});
	});

	it('offers no trainer choice on a session that is over', async () => {
		stubApi(placed);
		const screen = render(RiderSheet, {
			session: session(false),
			rider: sara,
			locale: 'en',
			onclose: () => {},
			onsession: () => {}
		});
		await expect.element(screen.getByRole('textbox')).toBeVisible();
		await expect.element(screen.getByRole('combobox', { name: 'Trainer' })).not.toBeInTheDocument();
	});
});
