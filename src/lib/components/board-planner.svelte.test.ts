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
	days: [],
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
					rider: { memberId: 'm', name: 'Sara', level: null },
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
			rider: { memberId: 'm', name: 'Sara', level: null },
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

	describe('giving a group a trainer', () => {
		const group = (start = '18:00', editable = true): BoardSession => ({
			...session(start),
			editable,
			staff: [{ id: 'o', name: 'Omar' }],
			riders: ['Sara', 'Layla'].map((name) => ({
				...session(start).riders[0]!,
				bookingId: name,
				name
			}))
		});
		type Call = { url: string; body: unknown };
		function stubTrainers(): Call[] {
			const calls: Call[] = [];
			vi.stubGlobal(
				'fetch',
				vi.fn(async (url: string, init: RequestInit = {}) => {
					calls.push({ url, body: init.body ? JSON.parse(String(init.body)) : undefined });
					return Response.json(group());
				})
			);
			return calls;
		}

		it('gives the ticked riders one trainer in a single request', async () => {
			const calls = stubTrainers();
			const onsession = vi.fn();
			const screen = render(BoardPlanner, {
				session: group(),
				locale: 'en',
				onsession,
				selecting: true
			});

			await screen.getByRole('button', { name: /Sara/ }).click();
			await screen.getByRole('button', { name: /Layla/ }).click();
			await expect.element(screen.getByText('2 selected')).toBeVisible();
			await screen.getByRole('button', { name: 'Trainer…' }).click();
			await screen.getByRole('button', { name: 'Omar' }).click();

			await vi.waitFor(() => expect(onsession).toHaveBeenCalled());
			expect(calls).toEqual([
				{
					url: '/api/board/riders/trainer',
					body: { bookingIds: ['Sara', 'Layla'], trainerId: 'o' }
				}
			]);
			await expect.element(screen.getByText('2 selected')).not.toBeInTheDocument();
		});

		it('puts riders back with the arena trainer', async () => {
			const calls = stubTrainers();
			const screen = render(BoardPlanner, {
				session: group(),
				locale: 'en',
				onsession: () => {},
				selecting: true
			});

			await screen.getByRole('button', { name: /Sara/ }).click();
			await screen.getByRole('button', { name: 'Trainer…' }).click();
			await screen.getByRole('button', { name: 'Same as arena' }).click();

			await vi.waitFor(() => expect(calls).toHaveLength(1));
			expect(calls[0]!.body).toEqual({ bookingIds: ['Sara'], trainerId: null });
		});

		it('forgets the selection when the session changes', async () => {
			const calls = stubTrainers();
			const screen = render(BoardPlanner, {
				session: group(),
				locale: 'en',
				onsession: () => {},
				selecting: true
			});

			await screen.getByRole('button', { name: /Sara/ }).click();
			await expect.element(screen.getByText('1 selected')).toBeVisible();
			await screen.rerender({ session: group('18:30'), locale: 'en', onsession: () => {} });

			await expect.element(screen.getByText('1 selected')).not.toBeInTheDocument();
			expect(calls).toHaveLength(0);
		});
	});
});
