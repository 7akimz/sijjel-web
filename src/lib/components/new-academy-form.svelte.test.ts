import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Country, Discipline } from '#lib/api/types.js';
import NewAcademyForm from './NewAcademyForm.svelte';

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

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('NewAcademyForm', () => {
	it('starts in Egypt, with riders booking their own', async () => {
		const screen = render(NewAcademyForm, {
			countries,
			disciplines,
			rootHost: 'sijjel.com',
			locale: 'en',
			oncreated: () => {},
			oncancel: () => {}
		});

		await expect.element(screen.getByLabelText('Country')).toHaveValue('EG');
		await expect
			.element(screen.getByText('Sets the currency (EGP) and phone numbers (+20)'))
			.toBeVisible();
		await expect
			.element(screen.getByRole('radio', { name: /Riders book their own/ }))
			.toBeChecked();
	});

	it('sends the country and who books, and takes the time zone from the country', async () => {
		const fetch = vi.fn(async () => Response.json({ id: 'a1' }, { status: 201 }));
		vi.stubGlobal('fetch', fetch);
		const oncreated = vi.fn();
		const screen = render(NewAcademyForm, {
			countries,
			disciplines,
			rootHost: 'sijjel.com',
			locale: 'en',
			oncreated,
			oncancel: () => {}
		});

		await screen.getByLabelText('Web address').fill('alnour');
		await screen.getByLabelText('Name (English)').fill('Al Nour');
		await screen.getByLabelText('Name (Arabic)').fill('alnour');
		await screen.getByLabelText('Country').selectOptions('SA');
		await expect.element(screen.getByLabelText('Time zone')).toHaveValue('Asia/Riyadh');
		await screen.getByRole('radio', { name: /Staff book for their riders/ }).click();
		await screen.getByRole('button', { name: 'Create academy' }).click();

		await vi.waitFor(() => expect(oncreated).toHaveBeenCalled());
		const body = JSON.parse(
			(fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string
		);
		expect(body).toMatchObject({ country: 'SA', ridersBook: false, timeZone: 'Asia/Riyadh' });
	});
});
