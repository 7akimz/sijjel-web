import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SetupChecklist from './SetupChecklist.svelte';

describe('SetupChecklist', () => {
	it('shows progress and links to the open steps', async () => {
		const screen = render(SetupChecklist, {
			state: { hours: { done: true }, arenas: { done: false }, horses: { done: false } },
			academyName: 'Al Faris Academy'
		});

		await expect.element(screen.getByText('1 of 3 done')).toBeVisible();
		await expect.element(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
		const arenas = screen.getByRole('link', { name: /Arenas/ });
		await expect
			.element(arenas)
			.toHaveAttribute('href', expect.stringMatching(/\/settings\/arenas\?setup$/));
		await expect
			.element(screen.getByRole('link', { name: /Horses/ }))
			.toHaveAttribute('href', expect.stringMatching(/\/horses\/new\?setup$/));
	});

	it('renders nothing once every step is done', () => {
		const { container } = render(SetupChecklist, {
			state: { hours: { done: true }, arenas: { done: true }, horses: { done: true } },
			academyName: 'Al Faris Academy'
		});

		expect(container.querySelector('.sj-card')).toBeNull();
	});
});
