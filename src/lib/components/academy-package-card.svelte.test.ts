import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { AcademySubscription as Subscription, Package } from '#lib/api/subscription-types.js';
import AcademyPackageCard from './AcademyPackageCard.svelte';

const starter: Package = {
	id: 'starter',
	nameEn: 'Starter',
	nameAr: 'مبتدئ',
	maxRiders: 25,
	monthlyPrice: 1500,
	isActive: true,
	country: 'EG',
	currency: 'EGP'
};

const subscription = (extra: Partial<Subscription>): Subscription => ({
	package: starter,
	status: 'paid',
	paidUntil: '2026-12-15',
	monthsUnpaid: 0,
	amountUnpaid: 0,
	blocked: false,
	riders: { count: 3, limit: 25 },
	currency: 'EGP',
	entries: [],
	...extra
});

function stubFetch() {
	const calls: { url: string; method: string }[] = [];
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string, init: RequestInit = {}) => {
			calls.push({ url, method: init.method ?? 'GET' });
			return Response.json(subscription({ status: 'free' }));
		})
	);
	return calls;
}

afterEach(() => vi.unstubAllGlobals());

const props = (s: Subscription, onchange: (s: Subscription) => void = () => {}) => ({
	academyId: 'a1',
	subscription: s,
	subscriptionHref: '/platform/academies/a1?tab=subscription',
	locale: 'en' as const,
	onchange
});

describe('AcademyPackageCard', () => {
	it('shows the package, price and paid-until date', async () => {
		const screen = render(AcademyPackageCard, props(subscription({})));

		await expect.element(screen.getByRole('heading', { name: 'Package' })).toBeVisible();
		await expect.element(screen.getByText('Starter')).toBeVisible();
		await expect.element(screen.getByText('Up to 25 riders')).toBeVisible();
		await expect.element(screen.getByText(/^EGP\s1,500 a month$/)).toBeVisible();
		await expect.element(screen.getByText('Paid until 15 December 2026')).toBeVisible();
	});

	it('starts a waiting trial on request', async () => {
		const calls = stubFetch();
		const onchange = vi.fn();
		const screen = render(
			AcademyPackageCard,
			props(
				subscription({ status: 'trial_waiting', paidUntil: null, trialDaysWaiting: 45 }),
				onchange
			)
		);

		await expect
			.element(screen.getByText('45 free days start when setup is finished.'))
			.toBeVisible();
		await screen.getByRole('button', { name: 'Start the trial now' }).click();

		await expect.poll(() => calls.length).toBe(1);
		expect(calls[0]).toEqual({ url: '/api/platform/academies/a1/trial/start', method: 'POST' });
		await expect.poll(() => onchange.mock.calls.length).toBe(1);
		expect(onchange.mock.calls[0][0].status).toBe('free');
	});

	it('links to the Subscription tab when there is no package', async () => {
		const screen = render(
			AcademyPackageCard,
			props(subscription({ package: null, status: 'no_package', paidUntil: null }))
		);

		await expect.element(screen.getByText('No package yet.')).toBeVisible();
		await expect
			.element(screen.getByRole('link', { name: 'Choose a package' }))
			.toHaveAttribute('href', '/platform/academies/a1?tab=subscription');
	});
});
