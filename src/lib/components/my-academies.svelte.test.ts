import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { MyAcademy } from '#lib/api/types.js';
import MyAcademies from './MyAcademies.svelte';

const academies: MyAcademy[] = [
	{
		slug: 'alfaris',
		nameEn: 'Al Faris',
		nameAr: 'Al Faris AR',
		primaryColor: '#7A5230',
		roles: ['rider']
	},
	{
		slug: 'nileriders',
		nameEn: 'Nile Riders Equestrian Club',
		nameAr: 'Nile Riders AR',
		primaryColor: '#2F5D50',
		roles: ['trainer', 'admin']
	}
];

describe('MyAcademies', () => {
	it('links each academy through its sign-in link, with your role and its address', async () => {
		const screen = render(MyAcademies, { academies, host: 'sijjel.com', locale: 'en' });

		await expect
			.element(screen.getByRole('heading', { name: 'Your academies', level: 1 }))
			.toBeVisible();
		const alfaris = screen.getByRole('link', { name: /Al Faris/ });
		await expect.element(alfaris).toHaveAttribute('href', '/open/alfaris');
		await expect.element(alfaris.getByText('Rider')).toBeVisible();
		await expect.element(alfaris.getByText('alfaris.sijjel.com')).toBeVisible();
		const nile = screen.getByRole('link', { name: /Nile Riders/ });
		await expect.element(nile.getByText('Admin')).toBeVisible();
		await expect.element(nile.getByText('Trainer')).not.toBeInTheDocument();
	});

	it('names academies in the reader’s language', async () => {
		const screen = render(MyAcademies, { academies, host: 'sijjel.com', locale: 'ar' });

		await expect.element(screen.getByText('Al Faris AR')).toBeVisible();
	});

	it('tells someone in no academy how to join one', async () => {
		const screen = render(MyAcademies, { academies: [], host: 'sijjel.com', locale: 'en' });

		await expect.element(screen.getByText("You're not in an academy yet")).toBeVisible();
		await expect
			.element(
				screen.getByText('Open the invite link your academy sent you. Each academy sends its own.')
			)
			.toBeVisible();
	});
});
