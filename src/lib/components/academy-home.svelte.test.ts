import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Membership } from '#lib/api/types.js';
import AcademyHome from './AcademyHome.svelte';

const membership = (status: Membership['status']): Membership => ({
	roles: ['rider'],
	status,
	discipline: null,
	level: null,
	setupDone: true,
	bookingPaused: false
});

describe('AcademyHome', () => {
	it('tells someone who left that they are no longer a member, without alarm', async () => {
		const screen = render(AcademyHome, { membership: membership('left'), locale: 'en' });

		await expect.element(screen.getByText("You're no longer a member here.")).toBeVisible();
		expect(screen.container.textContent).not.toContain('Suspended');
		expect(screen.container.textContent).not.toContain('Active');
	});
});
