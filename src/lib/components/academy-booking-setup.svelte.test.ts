import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Country } from '#lib/api/types.js';
import AcademyBookingSetup from './AcademyBookingSetup.svelte';

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

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('AcademyBookingSetup', () => {
	it('saves only what changed', async () => {
		const fetch = vi.fn(async () => Response.json({ ridersBook: false }));
		vi.stubGlobal('fetch', fetch);
		const screen = render(AcademyBookingSetup, {
			academyId: 'a1',
			country: 'EG',
			ridersBook: true,
			countries,
			locale: 'en'
		});

		await screen.getByRole('radio', { name: /Staff book for their riders/ }).click();
		await screen.getByRole('button', { name: 'Save' }).click();

		await expect.element(screen.getByText('Country and booking saved.')).toBeVisible();
		expect(fetch).toHaveBeenCalledTimes(1);
		const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('/api/platform/academies/a1/riders-book');
		expect(JSON.parse(init.body as string)).toEqual({ ridersBook: false });
	});
});
