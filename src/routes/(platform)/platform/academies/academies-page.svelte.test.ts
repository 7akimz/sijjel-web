import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { AcademySummary } from '#lib/api/types.js';
import AcademiesPage from './+page.svelte';

const academy = (extra: Partial<AcademySummary>): AcademySummary => ({
	id: 'a1',
	slug: 'alfaris',
	nameEn: 'Al Faris Academy',
	nameAr: 'أكاديمية الفارس',
	isActive: true,
	disciplines: ['show_jumping'],
	ownerCount: 1,
	package: null,
	riders: { count: 18, limit: 25 },
	status: 'paid',
	paidUntil: '2026-12-15',
	monthsUnpaid: 0,
	blocked: false,
	owner: {
		state: 'joined',
		name: 'Karim',
		inviteId: null,
		sentAt: null,
		expiresAt: null,
		joinedAt: '2026-11-01T00:00:00Z'
	},
	setup: {
		done: 4,
		total: 4,
		steps: { hours: true, arenas: true, horses: true, plans: true },
		finished: true,
		doneOn: null
	},
	country: 'EG',
	ridersBook: true,
	...extra
});

const paid = academy({});
const unpaid = academy({
	id: 'a2',
	slug: 'orlando',
	nameEn: 'Orlando Equestrian',
	status: 'unpaid',
	paidUntil: '2026-10-15',
	monthsUnpaid: 1,
	blocked: true
});

const show = () =>
	render(AcademiesPage, {
		data: { academies: [paid, unpaid], locale: 'en' },
		params: {}
	} as never);

describe('academies list', () => {
	it('links each row to its academy', async () => {
		const screen = show();

		const link = screen.getByRole('link', { name: /Al Faris Academy/ });
		await expect.element(link).toHaveAttribute('href', '/platform/academies/a1');
		expect(screen.getByRole('listitem').first().element().querySelectorAll('button')).toHaveLength(
			0
		);
	});

	it('shows status, riders and the paid or unpaid line', async () => {
		const screen = show();

		const first = screen.getByRole('link', { name: /Al Faris Academy/ });
		await expect.element(first).toHaveTextContent(/Paid until 15 Dec/);
		const second = screen.getByRole('link', { name: /Orlando Equestrian/ });
		await expect.element(second).toHaveTextContent(/Unpaid: 1 month/);
		await expect.element(second).toHaveTextContent(/Blocked/);
	});

	it('links New academy to the flow', async () => {
		const screen = show();
		await expect
			.element(screen.getByRole('link', { name: 'New academy' }))
			.toHaveAttribute('href', '/platform/academies/new');
	});

	it('keeps the status filter', async () => {
		const screen = show();

		await screen.getByLabelText('Show').selectOptions('blocked');

		await expect.element(screen.getByRole('link', { name: /Orlando Equestrian/ })).toBeVisible();
		await expect
			.element(screen.getByRole('link', { name: /Al Faris Academy/ }))
			.not.toBeInTheDocument();
	});
});
