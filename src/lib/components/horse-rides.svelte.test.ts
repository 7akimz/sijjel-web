import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { HorseRide, HorseRides as Rides } from '#lib/api/academy-types.js';
import HorseRides from './HorseRides.svelte';

const ride = (
	bookingId: string,
	start: string,
	riderName: string,
	extra: Partial<HorseRide> = {}
) => ({
	bookingId,
	memberId: `m-${riderName}`,
	riderName,
	start,
	arenaName: 'Main arena',
	trainerName: null,
	note: null,
	...extra
});

const rides = (over: Partial<Rides> = {}): Rides => ({
	maxPerDay: 2,
	lastWeek: { sessions: 3, fullDays: 1 },
	days: [
		{
			date: '2026-11-03',
			rides: [
				ride('b1', '18:00', 'Layla', { trainerName: 'Omar', note: 'Lazy at the start' }),
				ride('b2', '19:30', 'Sara')
			]
		},
		{ date: '2026-11-01', rides: [ride('b3', '20:00', 'Nour', { arenaName: null })] }
	],
	before: null,
	...over
});

afterEach(() => vi.unstubAllGlobals());

describe('HorseRides', () => {
	it('sums up the last 7 days and groups rides by day against the limit', async () => {
		const screen = render(HorseRides, { horseId: 'h1', rides: rides(), locale: 'en' });

		await expect
			.element(screen.getByText('Last 7 days · 3 sessions · 1 day at the limit'))
			.toBeVisible();
		await expect
			.element(screen.getByRole('heading', { name: /Tue 3 November 2026/ }))
			.toBeVisible();
		await expect.element(screen.getByText('2 of 2 sessions')).toHaveClass('full');
		await expect.element(screen.getByText('1 of 2 sessions')).not.toHaveClass('full');
	});

	it('links each ride to the rider and shows the arena, trainer and note', async () => {
		const screen = render(HorseRides, { horseId: 'h1', rides: rides(), locale: 'en' });

		const layla = screen.getByRole('link', { name: /Layla/ });
		await expect.element(layla).toHaveAttribute('href', '/members/m-Layla');
		await expect.element(layla).toHaveTextContent('18:00');
		await expect.element(layla).toHaveTextContent(/Main arena · .*Trainer Omar/);
		await expect.element(layla).toHaveTextContent('Lazy at the start');
		await expect.element(screen.getByRole('link', { name: /Nour/ })).not.toHaveTextContent('arena');
		await expect
			.element(screen.getByRole('button', { name: 'Show older rides' }))
			.not.toBeInTheDocument();
	});

	it('says so when the horse has no rides', async () => {
		const screen = render(HorseRides, {
			horseId: 'h1',
			rides: rides({ days: [], lastWeek: { sessions: 0, fullDays: 0 } }),
			locale: 'en'
		});

		await expect.element(screen.getByText('No rides yet.')).toBeVisible();
		await expect.element(screen.getByText('Last 7 days · No sessions')).toBeVisible();
	});

	it('loads older days with before and stops when none are left', async () => {
		const older = rides({
			days: [{ date: '2026-10-28', rides: [ride('b9', '18:00', 'Hakim')] }],
			before: null
		});
		const fetch = vi.fn(async () => Response.json(older));
		vi.stubGlobal('fetch', fetch);
		const screen = render(HorseRides, {
			horseId: 'h1',
			rides: rides({ before: '2026-11-01' }),
			locale: 'en'
		});

		await screen.getByRole('button', { name: 'Show older rides' }).click();

		await expect.element(screen.getByRole('link', { name: /Hakim/ })).toBeVisible();
		await expect.element(screen.getByRole('link', { name: /Layla/ })).toBeVisible();
		expect(fetch).toHaveBeenCalledWith(
			'/api/academy/horses/h1/rides?before=2026-11-01',
			expect.anything()
		);
		await expect
			.element(screen.getByRole('button', { name: 'Show older rides' }))
			.not.toBeInTheDocument();
	});
});
