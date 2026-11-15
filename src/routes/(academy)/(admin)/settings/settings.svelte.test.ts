import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SettingsPage from './+page.svelte';

const show = (ridersBook: boolean) =>
	render(SettingsPage, {
		data: { membership: { roles: ['admin'], status: 'active', ridersBook }, locale: 'en' },
		params: {}
	} as never);

describe('settings', () => {
	it('lists booking rules where riders book', async () => {
		const screen = show(true);

		await expect.element(screen.getByRole('link', { name: /Booking rules/ })).toBeVisible();
	});

	it('has no booking rules where staff book', async () => {
		const screen = show(false);

		await expect.element(screen.getByRole('link', { name: /Opening hours/ })).toBeVisible();
		await expect
			.element(screen.getByRole('link', { name: /Booking rules/ }))
			.not.toBeInTheDocument();
	});
});
