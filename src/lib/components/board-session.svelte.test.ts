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
});
