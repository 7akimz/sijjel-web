import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PackageForm from './PackageForm.svelte';

function stubFetch(respond: (body: Record<string, unknown>) => Response) {
	const bodies: Record<string, unknown>[] = [];
	vi.stubGlobal(
		'fetch',
		vi.fn(async (_url: string, init: RequestInit = {}) => {
			const body = JSON.parse(String(init.body));
			bodies.push(body);
			return respond(body);
		})
	);
	return bodies;
}

afterEach(() => vi.unstubAllGlobals());

async function fill(screen: ReturnType<typeof render>, riders: string) {
	await screen.getByLabelText('Name (English)').fill('Starter');
	await screen.getByLabelText('Name (Arabic)').fill('مبتدئ');
	if (riders) await screen.getByLabelText('Riders (empty for unlimited)').fill(riders);
	await screen.getByLabelText('Monthly price').fill('1500');
	await screen.getByRole('button', { name: 'Add package' }).click();
}

const countries = [
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

describe('PackageForm countries', () => {
	it('makes a package for a country, Egypt unless picked', async () => {
		const bodies = stubFetch((body) => Response.json({ id: 'k1', ...body }, { status: 201 }));
		const screen = render(PackageForm, { locale: 'en', countries, onsaved: () => {} });

		await expect.element(screen.getByLabelText('Country')).toHaveValue('EG');
		await expect.element(screen.getByText('In EGP, every month')).toBeVisible();
		await screen.getByLabelText('Country').selectOptions('SA');
		await expect.element(screen.getByText('In SAR, every month')).toBeVisible();
		await fill(screen, '25');

		await expect.poll(() => bodies.length).toBe(1);
		expect(bodies[0]).toMatchObject({ country: 'SA' });
	});

	it("keeps an existing package's country fixed", async () => {
		const screen = render(PackageForm, {
			locale: 'en',
			countries,
			initial: {
				id: 'k1',
				nameEn: 'Starter',
				nameAr: 'مبتدئ',
				maxRiders: 25,
				monthlyPrice: 300,
				isActive: true,
				country: 'SA',
				currency: 'SAR'
			},
			onsaved: () => {}
		});

		await expect.element(screen.getByLabelText('Country')).not.toBeInTheDocument();
		await expect.element(screen.getByText('In SAR, every month (Saudi Arabia)')).toBeVisible();
	});
});

describe('PackageForm', () => {
	it('sends an empty rider limit as null', async () => {
		const bodies = stubFetch((body) => Response.json({ id: 'k1', ...body }, { status: 201 }));
		const onsaved = vi.fn();
		const screen = render(PackageForm, { locale: 'en', onsaved });

		await fill(screen, '');

		await expect.poll(() => onsaved.mock.calls.length).toBe(1);
		expect(bodies[0]).toEqual({
			nameEn: 'Starter',
			nameAr: 'مبتدئ',
			maxRiders: null,
			monthlyPrice: 1500,
			isActive: true
		});
	});

	it('shows field errors from the API', async () => {
		stubFetch(() =>
			Response.json(
				{ code: 'validation_failed', status: 400, errors: { maxRiders: ['max_riders_invalid'] } },
				{ status: 400, headers: { 'content-type': 'application/problem+json' } }
			)
		);
		const screen = render(PackageForm, { locale: 'en', onsaved: () => {} });

		await fill(screen, '25');

		await expect
			.element(screen.getByText('Riders must be between 1 and 100,000, or empty for unlimited.'))
			.toBeVisible();
	});
});
