import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { BookingView, PlanSummary } from '#lib/api/member-types.js';
import type { Device } from '#lib/push/device.js';
import RiderHome from './RiderHome.svelte';

const offDevice: Device = {
	env: async () => ({
		userAgent: 'Mozilla/5.0 (Linux; Android 15) Chrome/130.0.0.0 Mobile',
		standalone: false,
		hasPush: true,
		permission: 'default',
		subscribed: false
	}),
	subscribe: async () => {},
	unsubscribe: async () => {}
};
const offer = 'Want to hear about changes like this straight away?';

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
	hasOwnHorse: false,
	bookingWindowDays: 2
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
	cancelReason: null,
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

	it('says why the academy cancelled a session', async () => {
		const cancelled = (date: string, cancelReason: string | null): BookingView => ({
			...booking(date, `${date}T15:00:00Z`),
			status: 'cancelled',
			cancelledByAcademy: true,
			cancelReason
		});
		const screen = render(RiderHome, {
			summary,
			locale: 'en',
			bookings: [cancelled('2099-01-03', 'Spring show'), cancelled('2099-01-04', null)]
		});

		await expect.element(screen.getByText('Cancelled: Spring show')).toBeVisible();
		await expect.element(screen.getByText('Cancelled by the academy')).toBeVisible();
	});

	it('offers notifications once, under the first session the academy cancelled', async () => {
		const cancelled = (date: string): BookingView => ({
			...booking(date, `${date}T15:00:00Z`),
			status: 'cancelled',
			cancelledByAcademy: true,
			cancelReason: 'Spring show'
		});
		const screen = render(RiderHome, {
			summary,
			locale: 'en',
			publicKey: 'key',
			device: offDevice,
			bookings: [cancelled('2099-01-03'), cancelled('2099-01-04')]
		});

		await expect.element(screen.getByText(offer)).toBeVisible();
		expect(screen.getByText(offer).elements()).toHaveLength(1);
	});

	it('does not offer notifications when nothing was cancelled', async () => {
		const screen = render(RiderHome, {
			summary,
			locale: 'en',
			publicKey: 'key',
			device: offDevice,
			bookings: [booking('2099-01-03', '2099-01-03T15:00:00Z')]
		});

		await expect.element(screen.getByText('School horse')).toBeVisible();
		await new Promise((r) => setTimeout(r, 50));
		await expect.element(screen.getByText(offer)).not.toBeInTheDocument();
	});
});

afterEach(() => vi.unstubAllGlobals());
