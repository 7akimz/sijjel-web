import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { PendingInvite } from '#lib/api/member-types.js';
import PendingInvites from './PendingInvites.svelte';

const invite = (id: string, name: string, role: PendingInvite['role']): PendingInvite => ({
	id,
	role,
	name,
	phone: null,
	discipline: null,
	level: null,
	plan: null,
	horseSource: null,
	expiresAt: '2026-11-12T10:00:00Z',
	createdAt: '2026-11-05T10:00:00Z'
});

const props = {
	shareName: 'Al Faris Academy',
	shareLocale: 'en' as const,
	locale: 'en' as const,
	onnotice: () => {},
	onfailure: () => {}
};

afterEach(() => vi.unstubAllGlobals());

describe('PendingInvites', () => {
	it('names the role only when the list mixes roles', async () => {
		const screen = render(PendingInvites, {
			...props,
			invites: [invite('a', 'Youssef', 'trainer')],
			showRole: true
		});

		await expect.element(screen.getByText('Trainer · Expires 12 November 2026')).toBeVisible();
	});

	it('leaves the role out on a list of one kind', async () => {
		const screen = render(PendingInvites, {
			...props,
			invites: [invite('a', 'Nour', 'rider')],
			showRole: false
		});

		await expect
			.element(screen.getByText('Expires 12 November 2026', { exact: true }))
			.toBeVisible();
	});

	it('cancels an invitation and says so', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(null, { status: 204 }))
		);
		const onnotice = vi.fn();
		const screen = render(PendingInvites, {
			...props,
			invites: [invite('a', 'Nour', 'rider')],
			showRole: false,
			onnotice
		});

		await screen.getByRole('button', { name: 'Cancel invitation' }).click();

		await vi.waitFor(() => expect(onnotice).toHaveBeenCalledWith('Invitation cancelled.'));
		await expect.element(screen.getByText('Nour')).not.toBeInTheDocument();
	});
});
