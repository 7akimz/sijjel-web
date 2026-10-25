import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SetupNext from './SetupNext.svelte';

const state = (hours: boolean, arenas: boolean, horses: boolean, plans = false) => ({
	hours: { done: hours },
	arenas: { done: arenas },
	horses: { done: horses },
	plans: { done: plans }
});

describe('SetupNext', () => {
	it('links to the next unfinished step, keeping the setup flow going', async () => {
		const screen = render(SetupNext, { state: state(true, false, false), current: 'arenas' });

		await expect
			.element(screen.getByRole('link', { name: 'Next: add your horses' }))
			.toHaveAttribute('href', expect.stringMatching(/\/horses\/new\?setup$/));
	});

	it('asks for a plan after the horses', async () => {
		const screen = render(SetupNext, { state: state(true, true, false), current: 'horses' });

		await expect
			.element(screen.getByRole('link', { name: 'Next: add a plan' }))
			.toHaveAttribute('href', expect.stringMatching(/\/settings\/plans\?setup$/));
	});

	it('sends the owner to invite riders after the last step', async () => {
		const screen = render(SetupNext, { state: state(true, true, true), current: 'plans' });

		await expect
			.element(screen.getByRole('link', { name: 'Setup done: invite your riders' }))
			.toHaveAttribute('href', expect.stringMatching(/\/members\/invite$/));
	});
});
