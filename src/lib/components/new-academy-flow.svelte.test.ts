import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Package } from '#lib/api/subscription-types.js';
import type { Country, Discipline } from '#lib/api/types.js';
import NewAcademyFlow from './NewAcademyFlow.svelte';

const countries: Country[] = [
	{
		code: 'EG',
		nameEn: 'Egypt',
		nameAr: 'مصر',
		currency: 'EGP',
		callingCode: '20',
		timeZone: 'Africa/Cairo'
	},
	{
		code: 'SA',
		nameEn: 'Saudi Arabia',
		nameAr: 'السعودية',
		currency: 'SAR',
		callingCode: '966',
		timeZone: 'Asia/Riyadh'
	}
];
const disciplines: Discipline[] = [
	{ id: 'd1', key: 'show_jumping', nameEn: 'Show jumping', nameAr: 'قفز', levels: [] }
];
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
const saudi: Package = { ...starter, id: 'saudi', nameEn: 'Riyadh Starter', country: 'SA' };

const created = {
	id: 'a9',
	slug: 'orlando',
	nameEn: 'Orlando Equestrian',
	nameAr: 'أورلاندو',
	country: 'EG'
};
const invite = {
	inviteId: 'i1',
	token: 't',
	expiresAt: '2026-11-27T10:00:00Z',
	url: 'https://orlando.sijjel.com/invite/t',
	phone: null
};

type Call = { url: string; method: string; body: unknown };

function stubFetch(academy: () => Response = () => Response.json(created, { status: 201 })) {
	const calls: Call[] = [];
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string, init: RequestInit = {}) => {
			calls.push({
				url,
				method: init.method ?? 'GET',
				body: init.body ? JSON.parse(String(init.body)) : undefined
			});
			if (url.endsWith('/owner-invites')) return Response.json(invite, { status: 201 });
			if (url.endsWith('/package')) return Response.json({});
			return academy();
		})
	);
	return calls;
}

afterEach(() => vi.unstubAllGlobals());

const props = (
	extra: Partial<{ packages: Package[]; onfinish: (id: string) => void; oncancel: () => void }> = {}
) => ({
	countries,
	disciplines,
	packages: [starter, saudi],
	rootHost: 'sijjel.com',
	locale: 'en' as const,
	onfinish: () => {},
	oncancel: () => {},
	...extra
});

async function fillStepOne(screen: ReturnType<typeof render>) {
	await screen.getByLabelText('Web address').fill('orlando');
	await screen.getByLabelText('Name (English)').fill('Orlando Equestrian');
	await screen.getByLabelText('Name (Arabic)').fill('orlando');
	await screen.getByRole('button', { name: 'Next' }).click();
}

async function create(screen: ReturnType<typeof render>) {
	await fillStepOne(screen);
	await screen.getByRole('button', { name: 'Create academy' }).click();
	await expect.element(screen.getByText('Step 3 of 4 · Package')).toBeVisible();
}

describe('NewAcademyFlow', () => {
	it('shows step 1 of 4 with the academy fields', async () => {
		const screen = render(NewAcademyFlow, props());

		await expect.element(screen.getByText('Step 1 of 4 · Academy')).toBeVisible();
		await expect.element(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
		await expect.element(screen.getByLabelText('Web address')).toBeVisible();
		await expect.element(screen.getByLabelText('Country')).not.toBeInTheDocument();
	});

	it('checks step 1 locally before going on', async () => {
		const calls = stubFetch();
		const screen = render(NewAcademyFlow, props());

		await screen.getByRole('button', { name: 'Next' }).click();

		await expect.element(screen.getByText('Step 1 of 4 · Academy')).toBeVisible();
		await expect.element(screen.getByLabelText('Web address')).toHaveFocus();
		expect(calls).toHaveLength(0);
	});

	it('goes back from step 2 with the fields kept', async () => {
		const screen = render(NewAcademyFlow, props());

		await fillStepOne(screen);
		await expect.element(screen.getByText('Step 2 of 4 · How it runs')).toBeVisible();
		await screen.getByRole('button', { name: 'Back' }).click();

		await expect.element(screen.getByLabelText('Web address')).toHaveValue('orlando');
	});

	it('starts in Egypt, with riders booking their own', async () => {
		const screen = render(NewAcademyFlow, props());
		await fillStepOne(screen);

		await expect.element(screen.getByLabelText('Country')).toHaveValue('EG');
		await expect
			.element(screen.getByText('Sets the currency (EGP) and phone numbers (+20)'))
			.toBeVisible();
		await expect
			.element(screen.getByRole('radio', { name: /Riders book their own/ }))
			.toBeChecked();
	});

	it('sends the country and who books, and takes the time zone from the country', async () => {
		const calls = stubFetch();
		const screen = render(NewAcademyFlow, props());
		await fillStepOne(screen);

		await screen.getByLabelText('Country').selectOptions('SA');
		await expect.element(screen.getByLabelText('Time zone')).toHaveValue('Asia/Riyadh');
		await screen.getByRole('radio', { name: /Staff book for their riders/ }).click();
		await screen.getByRole('button', { name: 'Create academy' }).click();

		await expect.poll(() => calls.length).toBe(1);
		expect(calls[0].url).toBe('/api/platform/academies');
		expect(calls[0].body).toMatchObject({
			slug: 'orlando',
			nameEn: 'Orlando Equestrian',
			country: 'SA',
			ridersBook: false,
			timeZone: 'Asia/Riyadh'
		});
	});

	it('goes back to step 1 when the API rejects the web address', async () => {
		stubFetch(() =>
			Response.json(
				{ code: 'validation_failed', status: 400, errors: { slug: ['slug_taken'] } },
				{ status: 400, headers: { 'content-type': 'application/problem+json' } }
			)
		);
		const screen = render(NewAcademyFlow, props());
		await fillStepOne(screen);
		await screen.getByRole('button', { name: 'Create academy' }).click();

		await expect.element(screen.getByText('Step 1 of 4 · Academy')).toBeVisible();
		await expect
			.element(screen.getByText('Another academy already uses this address.'))
			.toBeVisible();
	});

	it('offers the package step after creating', async () => {
		const calls = stubFetch();
		const screen = render(NewAcademyFlow, props());
		await create(screen);

		await expect
			.element(screen.getByText('Orlando Equestrian is created. Next, its package.'))
			.toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Finish later' })).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Back' })).not.toBeInTheDocument();
		await screen.getByLabelText('Package', { exact: true }).selectOptions('Starter');
		await screen.getByRole('button', { name: 'Save package' }).click();

		await expect.element(screen.getByText('Step 4 of 4 · Owner')).toBeVisible();
		expect(calls[1]).toEqual({
			url: '/api/platform/academies/a9/package',
			method: 'PUT',
			body: { packageId: 'starter', freeDays: 30, startAfterSetup: true }
		});
	});

	it('saves no package when the country has none', async () => {
		const calls = stubFetch();
		const screen = render(NewAcademyFlow, props({ packages: [saudi] }));
		await create(screen);

		const options = screen
			.getByLabelText('Package', { exact: true })
			.element()
			.querySelectorAll('option');
		expect([...options].map((o) => o.textContent)).toEqual(['Choose a package']);
		await screen.getByRole('button', { name: 'Save package' }).click();

		await expect.element(screen.getByText('Step 4 of 4 · Owner')).toBeVisible();
		expect(calls[1].body).toEqual({ packageId: null, freeDays: 30, startAfterSetup: true });
	});

	it('skips straight to the academy', async () => {
		stubFetch();
		const onfinish = vi.fn();
		const screen = render(NewAcademyFlow, props({ onfinish }));
		await create(screen);

		await screen.getByRole('button', { name: 'Skip for now' }).click();
		await expect.element(screen.getByText('Step 4 of 4 · Owner')).toBeVisible();
		await screen.getByRole('button', { name: 'Skip for now' }).click();

		expect(onfinish).toHaveBeenCalledWith('a9');
	});

	it('shares the invitation, then goes to the academy', async () => {
		const calls = stubFetch();
		const onfinish = vi.fn();
		const screen = render(NewAcademyFlow, props({ onfinish }));
		await create(screen);
		await screen.getByRole('button', { name: 'Skip for now' }).click();

		await expect
			.element(screen.getByText('The owner gets a link to sign up and set up the academy.'))
			.toBeVisible();
		await screen.getByLabelText('Their name').fill('Karim');
		await screen.getByRole('button', { name: 'Create invitation' }).click();

		await expect.element(screen.getByRole('link', { name: 'Send on WhatsApp' })).toBeVisible();
		expect(calls[1].url).toBe('/api/platform/academies/a9/owner-invites');
		await screen.getByRole('button', { name: 'Go to the academy' }).click();
		expect(onfinish).toHaveBeenCalledWith('a9');
	});

	it('leaves from step 1 without saving', async () => {
		const calls = stubFetch();
		const oncancel = vi.fn();
		const screen = render(NewAcademyFlow, props({ oncancel }));

		await screen.getByRole('button', { name: 'Academies' }).click();

		expect(oncancel).toHaveBeenCalled();
		expect(calls).toHaveLength(0);
	});
});
