import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { BookingView, PlanSummary } from '#lib/api/member-types.js';
import RiderHome from './RiderHome.svelte';

const summary: PlanSummary = {
	plan: {
		id: 'p',
		nameEn: 'Two',
		nameAr: 'اثنتان',
		lessonsPerMonth: 2,
		monthlyPrice: 1000,
		discipline: null,
		isActive: true
	},
	currency: 'EGP',
	lessonsPerMonth: 2,
	usedThisMonth: 1,
	leftThisMonth: 1,
	monthStart: '2099-01-01',
	monthEnd: '2099-01-31',
	paidThisMonth: true,
	unpaidBooking: 'allow',
	horseSource: 'school',
	hasOwnHorse: false
};

const booking = (date: string, startsAt: string): BookingView => ({
	id: date,
	date,
	start: '18:00',
	end: '18:30',
	startsAt,
	horseSource: 'school',
	ownHorseName: null,
	status: 'active',
	cancelledByAcademy: false,
	canCancel: false
});

describe('RiderHome', () => {
	it('keeps sessions already ridden in a past list', async () => {
		const screen = render(RiderHome, {
			summary,
			locale: 'en',
			bookings: [
				booking('2020-01-04', '2020-01-04T15:00:00Z'),
				booking('2099-01-03', '2099-01-03T15:00:00Z')
			]
		});

		const past = screen.getByRole('region', { name: 'Past sessions' });
		await expect.element(past.getByText(/4 January 2020/)).toBeVisible();
		await expect.element(past.getByText(/3 January 2099/)).not.toBeInTheDocument();
		await expect.element(past.getByText('Ask the academy to cancel')).not.toBeInTheDocument();
	});

	it('shows lessons left this month and gives one back on cancel', async () => {
		const upcoming = { ...booking('2099-01-03', '2099-01-03T15:00:00Z'), canCancel: true };
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => Response.json({ ...upcoming, status: 'cancelled' }))
		);
		const screen = render(RiderHome, { summary, locale: 'en', bookings: [upcoming] });
		await expect.element(screen.getByText('Left this month: 1 of 2')).toBeVisible();

		await screen.getByRole('button', { name: 'Cancel' }).click();

		await expect.element(screen.getByText('Left this month: 2 of 2')).toBeVisible();
	});
});

afterEach(() => vi.unstubAllGlobals());
