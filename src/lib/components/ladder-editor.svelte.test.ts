import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LadderEditor from './LadderEditor.svelte';

describe('LadderEditor', () => {
	it('disables removing a level that is in use', async () => {
		const screen = render(LadderEditor, {
			rows: [
				{ id: 'l1', nameEn: 'Intro', nameAr: 'ت', inUse: true },
				{ id: 'l2', nameEn: 'Novice', nameAr: 'م' }
			]
		});

		await expect
			.element(screen.getByRole('button', { name: 'Level 1 is used by a horse' }))
			.toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Remove level 2' })).toBeEnabled();
	});
});
