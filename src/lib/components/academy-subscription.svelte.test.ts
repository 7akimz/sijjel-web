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
	isActive: true,
	country: 'EG',
	currency: 'EGP'
};
const rising: Package = { ...starter, id: 'rising', nameEn: 'Rising', maxRiders: 40 };
const saudi: Package = {
	...starter,
	id: 'saudi',
	nameEn: 'Riyadh Starter',
	country: 'SA',
	currency: 'SAR'
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
	madeAt: '2026-11-15T08:00:00Z',
	first: false
});

const subscription = (extra: Partial<Subscription>): Subscription => ({
	package: starter,
	status: 'free',
	paidUntil: '2026-12-15',
	monthsUnpaid: 0,
	amountUnpaid: 0,
	blocked: false,
	riders: { count: 3, limit: 25 },
	currency: 'EGP',
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

function stubFetch(respond: () => Response = () => Response.json(subscription({}))) {
	const calls: { url: string; method: string; body: unknown }[] = [];
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string, init: RequestInit = {}) => {
			calls.push({
				url,
				method: init.method ?? 'GET',
				body: init.body ? JSON.parse(String(init.body)) : undefined
			});
			return respond();
		})
	);
	return calls;
}

const fieldError = (field: string, code: string) => () =>
	Response.json(
		{ code: 'validation_failed', status: 400, errors: { [field]: [code] } },
		{ status: 400, headers: { 'content-type': 'application/problem+json' } }
	);

const formOf = (screen: ReturnType<typeof render>, heading: string) =>
	screen.getByRole('heading', { name: heading }).element().closest('form') as HTMLFormElement;
const cardOf = (screen: ReturnType<typeof render>, heading: string) =>
	screen.getByRole('heading', { name: heading }).element().closest('.sj-card') as HTMLElement;
const openFreeTime = (screen: ReturnType<typeof render>) =>
	screen.getByRole('button', { name: 'Give free time' }).click();

afterEach(() => vi.unstubAllGlobals());

const props = (s: Subscription) => ({
	academyId: 'a1',
	subscription: s,
	packages: [starter, rising, saudi],
	country: 'EG',
	locale: 'en' as const,
	onchange: () => {}
});

const waiting = subscription({
	status: 'trial_waiting',
	paidUntil: null,
	entries: [],
	trialDaysWaiting: 45
});

describe('AcademySubscription', () => {
	it("offers only packages from the academy's country", async () => {
		stubFetch();
		const screen = render(AcademySubscription, props(none));

		await expect
			.element(
				screen.getByRole('option', { name: /^Starter · Up to 25 riders · EGP\s1,500 a month$/ })
			)
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('option', { name: /Riyadh Starter/ }))
			.not.toBeInTheDocument();
	});

	it('lets the free days wait for setup by default', async () => {
		const calls = stubFetch();
		const screen = render(AcademySubscription, props(none));
		const box = screen.getByLabelText('Start the free days when setup is finished');

		await expect.element(box).toBeChecked();
		await box.click();
		await screen.getByLabelText('Package').selectOptions('starter');
		await screen.getByRole('button', { name: 'Save package' }).click();

		await expect.poll(() => calls.length).toBe(1);
		expect(calls[0].body).toEqual({ packageId: 'starter', freeDays: 30, startAfterSetup: false });
	});

	it('shows what waits and starts it on request', async () => {
		const calls = stubFetch();
		const screen = render(AcademySubscription, props(waiting));

		await screen.getByRole('button', { name: 'Change' }).click();
		await expect.element(screen.getByLabelText('Free days to start with')).toHaveValue(45);
		await expect
			.element(screen.getByLabelText('Start the free days when setup is finished'))
			.toBeChecked();
		await expect
			.element(screen.getByRole('heading', { name: 'Mark month paid' }))
			.not.toBeInTheDocument();
		await expect
			.element(screen.getByText('Payments and free time open once the trial starts.'))
			.toBeVisible();

		await screen.getByRole('button', { name: 'Start the trial now' }).click();

		await expect.poll(() => calls.length).toBe(1);
		expect(calls[0]).toMatchObject({
			url: '/api/platform/academies/a1/trial/start',
			method: 'POST'
		});
	});

	it('has no Start the trial now when nothing waits', async () => {
		const screen = render(AcademySubscription, props(none));
		await expect
			.element(screen.getByRole('button', { name: 'Start the trial now' }))
			.not.toBeInTheDocument();
	});

	it('offers free days only before the first entry', async () => {
		const calls = stubFetch();
		const screen = render(AcademySubscription, props(none));

		await expect.element(screen.getByLabelText('Free days to start with')).toHaveValue(30);
		await screen.getByLabelText('Package').selectOptions('starter');
		await screen.getByRole('button', { name: 'Save package' }).click();

		await expect.poll(() => calls.length).toBe(1);
		expect(calls[0]).toEqual({
			url: '/api/platform/academies/a1/package',
			method: 'PUT',
			body: { packageId: 'starter', freeDays: 30, startAfterSetup: true }
		});
		await expect.element(screen.getByLabelText('Free days to start with')).not.toBeInTheDocument();
	});

	it('has no No package option once on a package', async () => {
		const screen = render(AcademySubscription, props(subscription({})));
		await screen.getByRole('button', { name: 'Change' }).click();
		const options = screen.getByLabelText('Package').element().querySelectorAll('option');
		expect([...options].map((o) => o.textContent?.replace(/\s/g, ' '))).toEqual([
			'Starter · Up to 25 riders · EGP 1,500 a month',
			'Rising · Up to 40 riders · EGP 1,500 a month'
		]);
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
			url: '/api/platform/academies/a1/entries/e2',
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

	it('shows a free-time note error on the free-time card', async () => {
		stubFetch(fieldError('note', 'note_too_long'));
		const screen = render(AcademySubscription, props(subscription({})));

		await openFreeTime(screen);
		await screen.getByLabelText('Days').fill('7');
		await screen.getByRole('button', { name: 'Give free time' }).click();

		await expect.element(screen.getByText('Keep the note to 500 characters.')).toBeVisible();
		expect(cardOf(screen, 'Payments and free time').textContent).toContain(
			'Keep the note to 500 characters.'
		);
		expect(formOf(screen, 'Mark month paid').textContent).not.toContain(
			'Keep the note to 500 characters.'
		);
	});

	it('checks amounts and days are whole numbers before sending', async () => {
		const calls = stubFetch();
		const screen = render(AcademySubscription, props(subscription({})));

		await screen.getByLabelText('Amount').fill('');
		await screen.getByRole('button', { name: 'Mark month paid' }).click();
		await expect.element(screen.getByText('Enter an amount of 0 or more.')).toBeVisible();
		await screen.getByLabelText('Amount').fill('1500.5');
		await screen.getByRole('button', { name: 'Mark month paid' }).click();
		await openFreeTime(screen);
		await screen.getByLabelText('Days').fill('2.5');
		await screen.getByRole('button', { name: 'Give free time' }).click();
		await expect.element(screen.getByText('Days must be between 1 and 366.')).toBeVisible();
		expect(calls).toHaveLength(0);
	});

	it('says Saved on the card that acted', async () => {
		stubFetch();
		const screen = render(
			AcademySubscription,
			props(subscription({ entries: [entry('e2', 'paid'), entry('e1', 'free')] }))
		);

		await screen.getByRole('button', { name: 'Undo' }).click();

		await expect.element(screen.getByText('Saved.')).toBeVisible();
		expect(cardOf(screen, 'Payments and free time').textContent).toContain('Saved.');
	});

	it('keeps a typed amount when giving free time', async () => {
		stubFetch();
		const screen = render(AcademySubscription, props(subscription({})));

		await screen.getByLabelText('Amount').fill('1200');
		await openFreeTime(screen);
		await screen.getByLabelText('Days').fill('7');
		await screen.getByRole('button', { name: 'Give free time' }).click();

		await expect.element(screen.getByText('Saved.')).toBeVisible();
		await expect.element(screen.getByLabelText('Amount')).toHaveValue(1200);
	});

	it('moves focus into the block confirmation and back on cancel', async () => {
		const screen = render(AcademySubscription, props(subscription({})));

		await screen.getByRole('button', { name: 'Block booking' }).click();
		await expect.element(screen.getByRole('button', { name: 'Yes, block booking' })).toHaveFocus();
		await screen.getByRole('button', { name: 'Cancel' }).click();
		await expect.element(screen.getByRole('button', { name: 'Block booking' })).toHaveFocus();
	});

	it('shows the package and opens the select on Change', async () => {
		const screen = render(AcademySubscription, props(subscription({})));

		await expect.element(screen.getByText('Up to 25 riders')).toBeVisible();
		await expect.element(screen.getByLabelText('Package')).not.toBeInTheDocument();
		await screen.getByRole('button', { name: 'Change' }).click();

		await expect.element(screen.getByLabelText('Package')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Save package' })).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Cancel' })).toBeVisible();
	});

	it('cancelling Change keeps the saved package', async () => {
		const screen = render(AcademySubscription, props(subscription({})));

		await screen.getByRole('button', { name: 'Change' }).click();
		await screen.getByLabelText('Package').selectOptions('rising');
		await screen.getByRole('button', { name: 'Cancel' }).click();
		await screen.getByRole('button', { name: 'Change' }).click();

		await expect.element(screen.getByLabelText('Package')).toHaveValue('starter');
	});

	it('opens the package select at once without a package', async () => {
		const screen = render(AcademySubscription, props(none));
		await expect.element(screen.getByLabelText('Package')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Change' })).not.toBeInTheDocument();
	});

	it('opens Give free time inside the history card', async () => {
		const screen = render(AcademySubscription, props(subscription({})));

		await expect.element(screen.getByLabelText('Days')).not.toBeInTheDocument();
		await openFreeTime(screen);

		await expect.element(screen.getByLabelText('Days')).toBeVisible();
		expect(
			cardOf(screen, 'Payments and free time').contains(screen.getByLabelText('Days').element())
		).toBe(true);
		expect(screen.getByRole('button', { name: 'Give free time' }).elements()).toHaveLength(1);
		expect(
			screen.getByRole('button', { name: 'Give free time' }).element().getAttribute('type')
		).toBe('submit');
	});

	it('shows no Give free time while the trial waits', async () => {
		const screen = render(AcademySubscription, props(waiting));
		await expect
			.element(screen.getByText('Payments and free time open once the trial starts.'))
			.toBeVisible();
		await expect
			.element(screen.getByRole('button', { name: 'Give free time' }))
			.not.toBeInTheDocument();
	});

	it('warns at the top when unpaid', async () => {
		const screen = render(
			AcademySubscription,
			props(subscription({ status: 'unpaid', monthsUnpaid: 2, amountUnpaid: 3000, blocked: true }))
		);

		const banner = screen.getByText(/^Unpaid: 2 months · EGP\s3,000 Booking is blocked\.$/);
		await expect.element(banner).toBeVisible();
		const first = screen.container.querySelector('.sj-stack')?.firstElementChild;
		expect(first?.contains(banner.element())).toBe(true);
	});

	it('has no unpaid banner when blocked by hand', async () => {
		const screen = render(AcademySubscription, props(subscription({ blocked: true })));
		await expect.element(screen.getByRole('button', { name: 'Unblock' })).toBeVisible();
		expect(screen.container.textContent).not.toMatch(/Unpaid/);
	});

	it('unblocks in one tap', async () => {
		const calls = stubFetch();
		const screen = render(AcademySubscription, props(subscription({ blocked: true })));

		await screen.getByRole('button', { name: 'Unblock' }).click();

		await expect.poll(() => calls.length).toBe(1);
		expect(calls[0]).toEqual({
			url: '/api/platform/academies/a1/blocked',
			method: 'PUT',
			body: { blocked: false }
		});
		await expect.element(screen.getByText('Saved.')).toBeVisible();
		expect(screen.getByRole('button', { name: 'Yes, unblock' }).elements()).toHaveLength(0);
		const cards = screen.container.querySelectorAll('.sj-card');
		expect(cards[cards.length - 1].textContent).toContain('Saved.');
	});

	it('puts the block card last', async () => {
		const screen = render(AcademySubscription, props(subscription({})));
		await expect.element(screen.getByRole('button', { name: 'Block booking' })).toBeVisible();
		const cards = screen.container.querySelectorAll('.sj-card');
		const last = cards[cards.length - 1].textContent ?? '';
		expect(last).toContain('Block booking');
		expect(last).toContain(
			'New bookings stop until you unblock this academy or record a paid month.'
		);
	});
});
