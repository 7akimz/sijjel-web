import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { AcademySubscription, SubscriptionEntry } from '#lib/api/subscription-types.js';
import SubscriptionPage from './+page.svelte';

const entry = (id: string, e: Partial<SubscriptionEntry>): SubscriptionEntry => ({
	id,
	kind: 'free',
	amount: null,
	method: null,
	days: 30,
	note: null,
	startsOn: '2026-12-03',
	endsOn: '2027-01-02',
	madeBy: 'admin@sijjel.com',
	madeAt: '2026-12-03T09:00:00Z',
	...e
});

const sub = (s: Partial<AcademySubscription>): AcademySubscription => ({
	package: {
		id: 'p',
		nameEn: 'Starter',
		nameAr: 'Starter',
		maxRiders: 25,
		monthlyPrice: 1500,
		isActive: true
	},
	status: 'free',
	paidUntil: '2027-01-02',
	monthsUnpaid: 0,
	amountUnpaid: 0,
	blocked: false,
	riders: { count: 3, limit: 25 },
	entries: [entry('e1', {})],
	...s
});

const show = (s: AcademySubscription) =>
	render(SubscriptionPage, { data: { subscription: s, locale: 'en' }, params: {} } as never);

describe('owner subscription page', () => {
	it('shows the first month as active, with the next payment', async () => {
		const screen = show(sub({}));

		await expect.element(screen.getByText('Active')).toBeVisible();
		await expect.element(screen.getByText('Next payment due on 2 January 2027')).toBeVisible();
		await expect.element(screen.getByRole('heading', { name: 'Recent payments' })).toBeVisible();
		await expect.element(screen.getByText('First month · 3 Dec → 2 Jan')).toBeVisible();
		expect(document.body.textContent).not.toMatch(/\bfree\b/i);
	});

	it('calls later free time extra time', async () => {
		const screen = show(
			sub({
				paidUntil: '2027-01-17',
				entries: [
					entry('e2', { days: 14, startsOn: '2027-01-03', endsOn: '2027-01-17' }),
					entry('e1', {})
				]
			})
		);

		await expect.element(screen.getByText('Extra time · 14 days · 3 Jan → 17 Jan')).toBeVisible();
		await expect.element(screen.getByText('First month · 3 Dec → 2 Jan')).toBeVisible();
	});

	it('says nothing about status, dates or paying before the first month starts', async () => {
		const screen = show(sub({ status: 'not_started', paidUntil: null, entries: [] }));

		await expect.element(screen.getByRole('heading', { name: 'Starter' })).toBeVisible();
		await expect.element(screen.getByText('Riders: 3 of 25')).toBeVisible();
		await expect.element(screen.getByText('Not started')).not.toBeInTheDocument();
		await expect.element(screen.getByText(/Pay by InstaPay/)).not.toBeInTheDocument();
		await expect.element(screen.getByText(/due on|until/)).not.toBeInTheDocument();
	});

	it('keeps paid until for a paid month', async () => {
		const screen = show(
			sub({
				status: 'paid',
				entries: [entry('e2', { kind: 'paid', amount: 1500, method: 'cash', days: null })]
			})
		);

		await expect.element(screen.getByText('Paid until 2 January 2027')).toBeVisible();
	});
});
