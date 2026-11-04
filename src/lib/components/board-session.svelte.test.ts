import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { BoardRider, BoardSession as Session } from '#lib/api/board-types.js';
import BoardSession from './BoardSession.svelte';

const rider = (name: string, extra: Partial<BoardRider> = {}): BoardRider => ({
	bookingId: name,
	memberId: name,
	name,
	level: null,
	horseSource: 'school',
	horse: null,
	ownHorseName: null,
	arenaId: null,
	note: null,
	problems: [],
	trainer: null,
	...extra
});

const session: Session = {
	date: '2026-10-19',
	start: '18:00',
	end: '18:30',
	editable: true,
	times: [],
	days: [],
	arenas: [
		{
			id: 'main',
			name: 'Main arena',
			capacity: 2,
			placesLeft: 1,
			trainer: { id: 'o', name: 'Omar' }
		},
		{ id: 'side', name: 'Side arena', capacity: 2, placesLeft: 2, trainer: null }
	],
	staff: [],
	riders: [
		rider('Sara'),
		rider('Layla', {
			arenaId: 'main',
			horse: { id: 'z', name: 'Zahra' },
			problems: ['horse_unavailable']
		})
	]
};

describe('BoardSession', () => {
	it('puts unplaced riders in a callout before the arenas and opens a rider', async () => {
		const onrider = vi.fn();
		const screen = render(BoardSession, { session, locale: 'en', onrider, ontrainer: () => {} });

		const headings = screen.container.querySelectorAll('h2');
		expect([...headings].map((h) => h.textContent?.trim())).toEqual([
			"1 rider isn't placed yet",
			'Main arena',
			'Side arena'
		]);
		const waiting = screen.container.querySelector('.waiting');
		expect(waiting?.textContent).toContain('Sara');
		expect(waiting?.textContent).not.toContain('Layla');
		await expect.element(screen.getByRole('button', { name: /Sara.*Pick horse/ })).toBeVisible();
		await expect.element(screen.getByLabelText('This horse is unavailable today.')).toBeVisible();
		await screen.getByRole('button', { name: /Layla.*Zahra/ }).click();
		expect(onrider).toHaveBeenCalledWith(expect.objectContaining({ name: 'Layla' }));
	});

	it('gives each arena one line: its riders against capacity and its trainer, who can be changed', async () => {
		const ontrainer = vi.fn();
		const screen = render(BoardSession, { session, locale: 'en', onrider: () => {}, ontrainer });

		expect(screen.container.textContent).toContain('Riders: 1 of 2');
		expect(screen.container.textContent).toContain('Riders: 0 of 2');
		await expect.element(screen.getByText('1 of 2', { exact: true })).toBeVisible();
		await expect
			.element(screen.getByRole('button', { name: 'Trainer for Side arena: Add trainer' }))
			.toBeVisible();
		await screen.getByRole('button', { name: 'Trainer for Main arena: Omar' }).click();
		expect(ontrainer).toHaveBeenCalledWith(expect.objectContaining({ id: 'main' }));
	});

	it('shows an empty arena as its heading line only', async () => {
		const screen = render(BoardSession, {
			session,
			locale: 'en',
			onrider: () => {},
			ontrainer: () => {}
		});

		const side = [...screen.container.querySelectorAll('section')].find((s) =>
			s.textContent?.includes('Side arena')
		);
		expect(side?.querySelector('ul')).toBeNull();
	});

	it("shows the rider's level beside their name", async () => {
		const screen = render(BoardSession, {
			session: {
				...session,
				riders: [rider('Sara', { level: { nameEn: 'Intro', nameAr: 'مبتدئ' } })]
			},
			locale: 'en',
			onrider: () => {},
			ontrainer: () => {}
		});

		await expect.element(screen.getByRole('button', { name: /Sara.*Intro/ })).toBeVisible();
	});

	it('shows the action it is given inside the callout', async () => {
		const screen = render(BoardSession, {
			session,
			locale: 'en',
			onrider: () => {},
			ontrainer: () => {},
			waitingAction: createRawSnippet(() => ({ render: () => '<button>Suggest horses</button>' }))
		});

		const waiting = screen.container.querySelector('.waiting');
		expect(waiting?.querySelector('button')?.textContent).toBe('Suggest horses');
	});

	it('splits an arena into trainer groups only when its riders have more than one trainer', async () => {
		const screen = render(BoardSession, {
			session: {
				...session,
				riders: [
					rider('Layla', { arenaId: 'main' }),
					rider('Nour', { arenaId: 'main', trainer: { id: 'a', name: 'Ahmed' } }),
					rider('Sara', { arenaId: 'side' })
				]
			},
			locale: 'en',
			onrider: () => {},
			ontrainer: () => {}
		});

		const subgroups = screen.container.querySelectorAll('h3');
		expect([...subgroups].map((h) => h.textContent?.trim())).toEqual(['Omar · 1', 'Ahmed · 1']);
	});

	it('shows no trainer groups when everyone follows the arena trainer', async () => {
		const screen = render(BoardSession, {
			session,
			locale: 'en',
			onrider: () => {},
			ontrainer: () => {}
		});
		expect(screen.container.querySelectorAll('h3')).toHaveLength(0);
	});

	it('ticks riders instead of opening them while selecting', async () => {
		const onrider = vi.fn();
		const ontoggle = vi.fn();
		const screen = render(BoardSession, {
			session,
			locale: 'en',
			onrider,
			ontrainer: () => {},
			selecting: true,
			selected: ['Sara'],
			ontoggle
		});

		await expect
			.element(screen.getByRole('button', { name: /Sara/ }))
			.toHaveAttribute('aria-pressed', 'true');
		await screen.getByRole('button', { name: /Layla/ }).click();
		expect(ontoggle).toHaveBeenCalledWith('Layla');
		expect(onrider).not.toHaveBeenCalled();
	});

	it('shows the trainer of riders who are not placed yet', async () => {
		const screen = render(BoardSession, {
			session: { ...session, riders: [rider('Sara', { trainer: { id: 'a', name: 'Ahmed' } })] },
			locale: 'en',
			onrider: () => {},
			ontrainer: () => {}
		});

		const subgroups = screen.container.querySelectorAll('h3');
		expect([...subgroups].map((h) => h.textContent?.trim())).toEqual(['Ahmed · 1']);
	});

	it('names the trainer who teaches an arena when every rider has someone other than the arena trainer', async () => {
		const ahmed = { id: 'a', name: 'Ahmed' };
		const screen = render(BoardSession, {
			session: {
				...session,
				riders: [
					rider('Layla', { arenaId: 'main', trainer: ahmed }),
					rider('Nour', { arenaId: 'main', trainer: ahmed })
				]
			},
			locale: 'en',
			onrider: () => {},
			ontrainer: () => {}
		});

		const subgroups = screen.container.querySelectorAll('h3');
		expect([...subgroups].map((h) => h.textContent?.trim())).toEqual(['Ahmed · 2']);
	});
});
