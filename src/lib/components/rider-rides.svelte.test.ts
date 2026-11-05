import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { RiderRide, RiderRides as Rides } from '#lib/api/member-types.js';
import RiderRides from './RiderRides.svelte';

const ride = (bookingId: string, date: string, extra: Partial<RiderRide> = {}): RiderRide => ({
	bookingId,
	date,
	start: '18:00',
	horseName: 'Stella',
	trainerName: null,
	note: null,
	...extra
});

const rides = (over: Partial<Rides> = {}): Rides => ({
	months: [
		{ month: '2026-11', rides: 2, notes: 1 },
		{ month: '2026-10', rides: 9, notes: 0 }
	],
	month: '2026-11',
	rides: [
		ride('b2', '2026-11-03', { trainerName: 'Omar', note: 'Good rising trot' }),
		ride('b1', '2026-11-01', { horseName: null })
	],
	...over
});

afterEach(() => vi.unstubAllGlobals());

describe('RiderRides', () => {
	it('opens this month and folds the others with their counts', async () => {
		const screen = render(RiderRides, {
			memberId: 'm1',
			rides: rides(),
			today: '2026-11-05',
			locale: 'en'
		});

		const november = screen.getByRole('group').filter({ hasText: 'November 2026' });
		await expect.element(november).toHaveAttribute('open');
		await expect.element(november).toHaveTextContent('2 rides · 1 note');
		const october = screen.getByRole('group').filter({ hasText: 'October 2026' });
		await expect.element(october).not.toHaveAttribute('open');
		await expect.element(october).toHaveTextContent('9 rides');
	});

	it('shows the horse, the trainer and the note of each ride', async () => {
		const screen = render(RiderRides, {
			memberId: 'm1',
			rides: rides(),
			today: '2026-11-05',
			locale: 'en'
		});

		const rows = screen.getByRole('listitem');
		await expect.element(rows.nth(0)).toHaveTextContent(/3\s*Tue/);
		await expect.element(rows.nth(0)).toHaveTextContent('Stella');
		await expect.element(rows.nth(0)).toHaveTextContent(/Trainer\s*Omar/);
		await expect.element(rows.nth(0)).toHaveTextContent('Good rising trot');
		await expect.element(rows.nth(1)).toHaveTextContent('School horse');
	});

	it('says this month has no rides yet when the latest month is older', async () => {
		const screen = render(RiderRides, {
			memberId: 'm1',
			rides: rides({
				months: [{ month: '2026-10', rides: 1, notes: 0 }],
				month: '2026-10',
				rides: [ride('b1', '2026-10-29')]
			}),
			today: '2026-11-01',
			locale: 'en'
		});

		await expect.element(screen.getByText('November 2026')).toBeVisible();
		await expect.element(screen.getByText('· No rides yet')).toBeVisible();
		await expect
			.element(screen.getByRole('group').filter({ hasText: 'October 2026' }))
			.toHaveAttribute('open');
	});

	it('says so when the rider has no rides', async () => {
		const screen = render(RiderRides, {
			memberId: 'm1',
			rides: { months: [], month: null, rides: [] },
			today: '2026-11-05',
			locale: 'en'
		});

		await expect.element(screen.getByText('No rides yet.')).toBeVisible();
		await expect.element(screen.getByRole('group')).not.toBeInTheDocument();
	});

	it('loads a month when it is opened', async () => {
		let answer: (r: Response) => void = () => {};
		const fetch = vi.fn(() => new Promise<Response>((resolve) => (answer = resolve)));
		vi.stubGlobal('fetch', fetch);
		const screen = render(RiderRides, {
			memberId: 'm1',
			rides: rides(),
			today: '2026-11-05',
			locale: 'en'
		});

		await screen.getByText('October 2026').click();

		await expect.element(screen.getByText('Loading rides…')).toBeVisible();
		expect(fetch).toHaveBeenCalledWith(
			'/api/academy/members/m1/rides?month=2026-10',
			expect.anything()
		);
		answer(
			Response.json(
				rides({ month: '2026-10', rides: [ride('b0', '2026-10-29', { horseName: 'Zein' })] })
			)
		);
		await expect.element(screen.getByText('Zein')).toBeVisible();
		await expect.element(screen.getByText('Loading rides…')).not.toBeInTheDocument();
	});
});
