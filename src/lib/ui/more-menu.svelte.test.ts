import { userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MoreMenu from './MoreMenu.svelte';

describe('MoreMenu', () => {
	const items = () => [
		{ label: 'Mark as left', onselect: vi.fn() },
		{ label: 'Suspend', onselect: vi.fn(), danger: true }
	];

	it('stays closed until its button is pressed', async () => {
		const screen = render(MoreMenu, { label: 'More actions', items: items() });

		await expect.element(screen.getByRole('menu')).not.toBeInTheDocument();
		await screen.getByRole('button', { name: 'More actions' }).click();

		await expect.element(screen.getByRole('menuitem', { name: 'Mark as left' })).toBeVisible();
		await expect
			.element(screen.getByRole('button', { name: 'More actions' }))
			.toHaveAttribute('aria-expanded', 'true');
	});

	it('runs the chosen item and closes', async () => {
		const given = items();
		const screen = render(MoreMenu, { label: 'More actions', items: given });

		await screen.getByRole('button', { name: 'More actions' }).click();
		await screen.getByRole('menuitem', { name: 'Suspend' }).click();

		expect(given[1].onselect).toHaveBeenCalledOnce();
		expect(given[0].onselect).not.toHaveBeenCalled();
		await expect.element(screen.getByRole('menu')).not.toBeInTheDocument();
	});

	it('closes on Escape', async () => {
		const screen = render(MoreMenu, { label: 'More actions', items: items() });

		await screen.getByRole('button', { name: 'More actions' }).click();
		await userEvent.keyboard('{Escape}');

		await expect.element(screen.getByRole('menu')).not.toBeInTheDocument();
	});
});
