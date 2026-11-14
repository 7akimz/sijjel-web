import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { SetupSummary } from '#lib/api/types.js';
import AcademySetup from './AcademySetup.svelte';

const setup = (s: Partial<SetupSummary>): SetupSummary => ({
	done: 2,
	total: 4,
	steps: { hours: true, arenas: true, horses: false, plans: false },
	finished: false,
	doneOn: null,
	...s
});

describe('AcademySetup', () => {
	it('counts the steps and ticks the done ones', async () => {
		const screen = render(AcademySetup, { setup: setup({}), locale: 'en' });

		await expect.element(screen.getByText('The owner has done 2 of 4 steps.')).toBeVisible();
		await expect.element(screen.getByRole('listitem').nth(0)).toHaveTextContent('Opening hours');
		await expect.element(screen.getByText('Opening hours, done')).toBeInTheDocument();
		await expect.element(screen.getByText('A school horse, not done yet')).toBeInTheDocument();
	});

	it('gives the setup day once finished', async () => {
		const screen = render(AcademySetup, {
			setup: setup({ done: 4, finished: true, doneOn: '2026-12-03' }),
			locale: 'en'
		});

		await expect.element(screen.getByText('Set up on 3 Dec.')).toBeVisible();
	});
});
