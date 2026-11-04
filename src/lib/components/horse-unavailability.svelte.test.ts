import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Horse } from '#lib/api/academy-types.js';
import HorseUnavailability from './HorseUnavailability.svelte';

const level = (id: string, nameEn: string, position: number) => ({
	id,
	nameEn,
	nameAr: nameEn,
	position
});

const horse = (unavailability: Horse['unavailability']): Horse => ({
	id: 'h1',
	name: 'Stella',
	kind: 'school',
	discipline: { id: 'd', key: 'groundwork', nameEn: 'Groundwork', nameAr: 'Groundwork' },
	minLevel: level('l1', 'Level 1', 1),
	maxLevel: level('l4', 'Level 4', 4),
	maxSessionsPerDay: 2,
	notes: null,
	isActive: true,
	unavailableToday: false,
	unavailability
});

const range = (id: string, from: string, to: string, reason: string | null = null) => ({
	id,
	from,
	to,
	reason
});

afterEach(() => vi.unstubAllGlobals());

describe('HorseUnavailability', () => {
	it('lists coming dates and folds past ones under Earlier', async () => {
		const screen = render(HorseUnavailability, {
			horse: horse([
				range('a', '2026-11-20', '2026-11-20', 'Shoeing'),
				range('b', '2026-10-01', '2026-10-02', 'Vet')
			]),
			today: '2026-11-04',
			locale: 'en',
			onchange: () => {}
		});

		await expect.element(screen.getByRole('heading', { name: 'Unavailable dates' })).toBeVisible();
		await expect.element(screen.getByText('20 November 2026')).toBeVisible();
		await expect.element(screen.getByText('Shoeing')).toBeVisible();
		await expect.element(screen.getByText('Earlier (1)')).toBeVisible();
		await expect.element(screen.getByText('Vet')).not.toBeVisible();
		await expect.element(screen.getByLabelText('Reason (optional)')).not.toBeInTheDocument();
	});

	it('says so when the horse has no coming dates', async () => {
		const screen = render(HorseUnavailability, {
			horse: horse([]),
			today: '2026-11-04',
			locale: 'en',
			onchange: () => {}
		});

		await expect.element(screen.getByText('No unavailable dates.')).toBeVisible();
		await expect.element(screen.getByText(/Earlier/)).not.toBeInTheDocument();
	});

	it('opens the form from Mark unavailable, adds the dates and closes it', async () => {
		const updated = horse([range('n', '2026-11-10', '2026-11-12', 'Lame')]);
		const fetch = vi.fn(async () => Response.json(updated));
		vi.stubGlobal('fetch', fetch);
		const onchange = vi.fn();
		const screen = render(HorseUnavailability, {
			horse: horse([]),
			today: '2026-11-04',
			locale: 'en',
			onchange
		});

		await screen.getByRole('button', { name: 'Mark unavailable' }).click();
		await screen.getByLabelText('From').fill('2026-11-10');
		await screen.getByLabelText('To').fill('2026-11-12');
		await screen.getByLabelText('Reason (optional)').fill('Lame');
		await screen.getByRole('button', { name: 'Add dates' }).click();

		await vi.waitFor(() => expect(onchange).toHaveBeenCalledWith(updated));
		expect(fetch).toHaveBeenCalledWith(
			'/api/academy/horses/h1/unavailability',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ from: '2026-11-10', to: '2026-11-12', reason: 'Lame' })
			})
		);
		await expect.element(screen.getByLabelText('Reason (optional)')).not.toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: 'Mark unavailable' })).toBeVisible();
	});

	it('closes the form on Cancel without saving', async () => {
		const fetch = vi.fn();
		vi.stubGlobal('fetch', fetch);
		const screen = render(HorseUnavailability, {
			horse: horse([]),
			today: '2026-11-04',
			locale: 'en',
			onchange: () => {}
		});

		await screen.getByRole('button', { name: 'Mark unavailable' }).click();
		await screen.getByRole('button', { name: 'Cancel' }).click();

		await expect.element(screen.getByLabelText('Reason (optional)')).not.toBeInTheDocument();
		expect(fetch).not.toHaveBeenCalled();
	});

	it('deletes an entry', async () => {
		const fetch = vi.fn(async () => Response.json(horse([])));
		vi.stubGlobal('fetch', fetch);
		const onchange = vi.fn();
		const screen = render(HorseUnavailability, {
			horse: horse([range('a', '2026-11-20', '2026-11-20')]),
			today: '2026-11-04',
			locale: 'en',
			onchange
		});

		await screen.getByRole('button', { name: 'Delete 20 November 2026' }).click();

		await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
		expect(fetch).toHaveBeenCalledWith(
			'/api/academy/horses/h1/unavailability/a',
			expect.objectContaining({ method: 'DELETE' })
		);
	});
});
