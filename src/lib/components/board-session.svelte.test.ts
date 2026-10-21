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
	it('groups riders by arena with unplaced riders first and opens a rider', async () => {
		const onrider = vi.fn();
		const screen = render(BoardSession, { session, locale: 'en', onrider, ontrainer: () => {} });

		const headings = screen.container.querySelectorAll('h2');
		expect([...headings].map((h) => h.textContent?.trim())).toEqual([
			'Not placed',
			'Main arena · Omar',
			'Side arena · No trainer'
		]);
		await expect.element(screen.getByRole('button', { name: /Sara.*Pick horse/ })).toBeVisible();
		await expect.element(screen.getByLabelText('This horse is unavailable today.')).toBeVisible();
		await screen.getByRole('button', { name: /Layla.*Zahra/ }).click();
		expect(onrider).toHaveBeenCalledWith(expect.objectContaining({ name: 'Layla' }));
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
});
