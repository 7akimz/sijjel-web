import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { AcademySummary, OwnerStatus } from '#lib/api/types.js';
import AcademyOwner from './AcademyOwner.svelte';

const now = new Date('2026-11-14T10:00:00Z');

const academy = (owner: Partial<OwnerStatus>): AcademySummary => ({
	id: 'a1',
	slug: 'alfaris',
	nameEn: 'Al Faris',
	nameAr: 'Al Faris',
	isActive: true,
	disciplines: [],
	ownerCount: 0,
	package: null,
	riders: { count: 0, limit: null },
	status: 'no_package',
	paidUntil: null,
	monthsUnpaid: 0,
	blocked: false,
	country: 'EG',
	ridersBook: true,
	owner: {
		state: 'none',
		name: null,
		inviteId: null,
		sentAt: null,
		expiresAt: null,
		joinedAt: null,
		...owner
	},
	setup: {
		done: 0,
		total: 4,
		steps: { hours: false, arenas: false, horses: false, plans: false },
		finished: false,
		doneOn: null
	}
});

const pending = academy({
	state: 'pending',
	name: 'Karim Mansour',
	inviteId: 'i1',
	sentAt: '2026-11-11T09:00:00Z',
	expiresAt: '2026-11-25T09:00:00Z'
});

const renewed = {
	inviteId: 'i2',
	token: 't2',
	expiresAt: '2026-11-28T10:00:00Z',
	url: 'https://alfaris.sijjel.com/invite/t2',
	phone: '201012345678'
};

function stubFetch(respond: () => Response) {
	const calls: { url: string; method: string }[] = [];
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string, init: RequestInit = {}) => {
			calls.push({ url, method: init.method ?? 'GET' });
			return respond();
		})
	);
	return calls;
}

const props = (a: AcademySummary) => ({ academy: a, now, locale: 'en' as const });

afterEach(() => vi.unstubAllGlobals());

describe('AcademyOwner', () => {
	it('shows a pending invite with who, when and until when', async () => {
		const screen = render(AcademyOwner, props(pending));

		await expect
			.element(screen.getByText('Invite sent 3 days ago, not accepted yet'))
			.toBeVisible();
		await expect.element(screen.getByText('Karim Mansour')).toBeVisible();
		await expect.element(screen.getByText('11 Nov, 3 days ago')).toBeVisible();
		await expect.element(screen.getByText('25 Nov')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Cancel invite' })).toBeVisible();
	});

	it('sends a new link and says the old one no longer works', async () => {
		const calls = stubFetch(() => Response.json(renewed, { status: 201 }));
		const screen = render(AcademyOwner, props(pending));

		await screen.getByRole('button', { name: 'Send again' }).click();

		await expect.poll(() => calls.length).toBe(1);
		expect(calls[0]).toEqual({ url: '/api/platform/invites/i1/renew', method: 'POST' });
		await expect.element(screen.getByRole('link', { name: 'Send on WhatsApp' })).toBeVisible();
		await expect.element(screen.getByText(/the old link no longer works/)).toBeVisible();
	});

	it('offers Send again but not Cancel invite once expired', async () => {
		const screen = render(
			AcademyOwner,
			props(academy({ ...pending.owner, state: 'expired', expiresAt: '2026-11-02T09:00:00Z' }))
		);

		await expect.element(screen.getByText('Invite expired on 2 Nov')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Send again' })).toBeVisible();
		await expect
			.element(screen.getByRole('button', { name: 'Cancel invite' }))
			.not.toBeInTheDocument();
	});

	it('offers to invite an owner when none was invited', async () => {
		const screen = render(AcademyOwner, props(academy({})));

		await expect.element(screen.getByText('No invite sent')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Invite owner' })).toBeVisible();
	});

	it('names the owner once joined', async () => {
		const screen = render(
			AcademyOwner,
			props(academy({ state: 'joined', name: 'Omar Said', joinedAt: '2026-11-01T09:00:00Z' }))
		);

		await expect.element(screen.getByText('Owner: Omar Said')).toBeVisible();
		await expect.element(screen.getByText('Joined on 1 Nov')).toBeVisible();
		await expect
			.element(screen.getByRole('button', { name: 'Send again' }))
			.not.toBeInTheDocument();
	});
});
