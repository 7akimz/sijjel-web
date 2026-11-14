import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Me } from '#lib/api/types.js';
import AccountPage from './+page.svelte';

const user: Me = {
	id: 'u1',
	phone: '201000000000',
	email: null,
	displayName: 'Layla',
	preferredLanguage: null,
	isPlatformAdmin: false
};

const renderPage = (publicKey: string | null) =>
	render(AccountPage, {
		data: { user, addPhone: false, publicKey, locale: 'en' },
		params: {}
	} as never);

describe('account page', () => {
	it('lets a rider manage notifications on this phone', async () => {
		const screen = renderPage('key');
		await expect.element(screen.getByRole('heading', { name: 'Notifications' })).toBeVisible();
	});

	it('has no notifications section without a push key', async () => {
		const screen = renderPage(null);
		await expect.element(screen.getByRole('heading', { name: 'Your account' })).toBeVisible();
		await expect
			.element(screen.getByRole('heading', { name: 'Notifications' }))
			.not.toBeInTheDocument();
	});
});
