import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SetupNext from './SetupNext.svelte';

const state = (hours: boolean, arenas: boolean, horses: boolean) => ({
	hours: { done: hours },
	arenas: { done: arenas },
	horses: { done: horses }
});

describe('SetupNext', () => {
	it('links to the next unfinished step, keeping the setup flow going', async () => {
		const screen = render(SetupNext, { state: state(true, false, false), current: 'arenas' });

		await expect
			.element(screen.getByRole('link', { name: 'Next: add your horses' }))
			.toHaveAttribute('href', expect.stringMatching(/\/horses\/new\?setup$/));
	});

	it('sends the owner to invite riders after the last step', async () => {
		const screen = render(SetupNext, { state: state(true, true, false), current: 'horses' });

		await expect
			.element(screen.getByRole('link', { name: 'Setup done: invite your riders' }))
			.toHaveAttribute('href', expect.stringMatching(/\/members\/invite$/));
	});
});
