import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MemberAccount from './MemberAccount.svelte';

const props = {
	memberId: 'm1',
	name: 'Layla',
	academy: 'Al Nour',
	shareLocale: 'en' as const,
	locale: 'en' as const
};

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('MemberAccount', () => {
	it('explains a rider without an account in plain words', async () => {
		const screen = render(MemberAccount, props);

		await expect.element(screen.getByRole('heading', { name: 'Account' })).toBeVisible();
		await expect.element(screen.getByText("Layla can't open sijjel yet.")).toBeVisible();
		await expect
			.element(
				screen.getByText(
					'Send an invite link if Layla wants to see their sessions in the app. You can book for Layla either way.'
				)
			)
			.toBeVisible();
	});

	it('makes an invite link for that rider and offers to share it', async () => {
		const fetch = vi.fn(async () =>
			Response.json(
				{
					inviteId: 'i1',
					token: 'tok',
					expiresAt: '2099-01-01T00:00:00Z',
					url: 'https://alnour.sijjel.com/invite/tok',
					phone: '201023456789'
				},
				{ status: 201 }
			)
		);
		vi.stubGlobal('fetch', fetch);
		const screen = render(MemberAccount, props);

		await screen.getByRole('button', { name: 'Send invite link' }).click();

		await expect
			.element(screen.getByLabelText('Invitation link'))
			.toHaveValue('https://alnour.sijjel.com/invite/tok');
		expect((fetch.mock.calls[0] as unknown as [string])[0]).toBe('/api/academy/members/m1/invite');
	});
});
