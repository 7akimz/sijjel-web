import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type {
	AcademySubscription as Subscription,
	Package,
	SubscriptionEntry
} from '#lib/api/subscription-types.js';
import AcademySubscription from './AcademySubscription.svelte';

const starter: Package = {
	id: 'starter',
	nameEn: 'Starter',
	nameAr: 'مبتدئ',
	maxRiders: 25,
	monthlyPrice: 1500,
	isActive: true
};

const entry = (id: string, kind: 'paid' | 'free'): SubscriptionEntry => ({
	id,
	kind,
	amount: kind === 'paid' ? 1500 : null,
	method: kind === 'paid' ? 'instapay' : null,
	days: kind === 'free' ? 30 : null,
	note: null,
	startsOn: '2026-11-15',
	endsOn: '2026-12-15',
	madeBy: 'Mona',
	madeAt: '2026-11-15T08:00:00Z'
});

const subscription = (extra: Partial<Subscription>): Subscription => ({
	package: starter,
	status: 'free',
	paidUntil: '2026-12-15',
	monthsUnpaid: 0,
	amountUnpaid: 0,
	blocked: false,
	riders: { count: 3, limit: 25 },
	entries: [entry('e1', 'free')],
	...extra
});

const none = subscription({
	package: null,
	status: 'no_package',
	paidUntil: null,
	riders: { count: 3, limit: null },
	entries: []
});

function stubFetch() {
	const calls: { url: string; method: string; body: unknown }[] = [];
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string, init: RequestInit = {}) => {
			calls.push({
				url,
				method: init.method ?? 'GET',
				body: init.body ? JSON.parse(String(init.body)) : undefined
			});
			return Response.json(subscription({}));
		})
	);
	return calls;
}

afterEach(() => vi.unstubAllGlobals());

const props = (s: Subscription) => ({
	academyId: 'a1',
	subscription: s,
	packages: [starter],
	locale: 'en' as const,
	onchange: () => {}
});

describe('AcademySubscription', () => {
	it('offers free days only before the first entry', async () => {
		const calls = stubFetch();
		const screen = render(AcademySubscription, props(none));

		await expect.element(screen.getByLabelText('Free days to start with')).toHaveValue(30);
		await screen.getByLabelText('Package').selectOptions('Starter');
		await screen.getByRole('button', { name: 'Save package' }).click();

		await expect.poll(() => calls.length).toBe(1);
		expect(calls[0]).toEqual({
			url: '/api/platform/academies/a1/package',
			method: 'PUT',
			body: { packageId: 'starter', freeDays: 30 }
		});
		await expect.element(screen.getByLabelText('Free days to start with')).not.toBeInTheDocument();
	});

	it('has no No package option once on a package', async () => {
		const screen = render(AcademySubscription, props(subscription({})));
		const options = screen.getByLabelText('Package').element().querySelectorAll('option');
		expect([...options].map((o) => o.textContent)).toEqual(['Starter']);
	});

	it('marks a month paid with the package price by default', async () => {
		const calls = stubFetch();
		const screen = render(AcademySubscription, props(subscription({})));

		await screen.getByRole('button', { name: 'Mark month paid' }).click();

		await expect.poll(() => calls.length).toBe(1);
		expect(calls[0]).toMatchObject({
			url: '/api/platform/academies/a1/payments',
			method: 'POST',
			body: { amount: 1500, method: 'instapay', fromToday: false }
		});
	});

	it('shows Start from today only when unpaid', async () => {
		const covered = render(AcademySubscription, props(subscription({})));
		await expect.element(covered.getByLabelText('Start from today')).not.toBeInTheDocument();
		covered.unmount();

		const unpaid = render(
			AcademySubscription,
			props(subscription({ status: 'unpaid', paidUntil: '2026-11-15', monthsUnpaid: 1 }))
		);
		await expect.element(unpaid.getByLabelText('Start from today')).toBeVisible();
	});

	it('undo is on the newest entry only', async () => {
		const calls = stubFetch();
		const screen = render(
			AcademySubscription,
			props(subscription({ status: 'paid', entries: [entry('e2', 'paid'), entry('e1', 'free')] }))
		);

		await expect.element(screen.getByRole('button', { name: 'Undo' })).toBeVisible();
		expect(screen.getByRole('button', { name: 'Undo' }).elements()).toHaveLength(1);
		await screen.getByRole('button', { name: 'Undo' }).click();

		await expect.poll(() => calls.length).toBe(1);
		expect(calls[0]).toMatchObject({
			url: '/api/platform/academies/a1/entries/latest',
			method: 'DELETE'
		});
	});

	it('blocks after confirming', async () => {
		const calls = stubFetch();
		const screen = render(AcademySubscription, props(subscription({})));

		await screen.getByRole('button', { name: 'Block booking' }).click();
		expect(calls).toHaveLength(0);
		await screen.getByRole('button', { name: 'Yes, block booking' }).click();

		await expect.poll(() => calls.length).toBe(1);
		expect(calls[0]).toEqual({
			url: '/api/platform/academies/a1/blocked',
			method: 'PUT',
			body: { blocked: true }
		});
	});

	it('hides payments and free time without a package', async () => {
		const screen = render(AcademySubscription, props(none));
		await expect
			.element(screen.getByRole('button', { name: 'Mark month paid' }))
			.not.toBeInTheDocument();
		await expect
			.element(screen.getByRole('button', { name: 'Give free time' }))
			.not.toBeInTheDocument();
	});
});
