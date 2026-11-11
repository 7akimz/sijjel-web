import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { MonthResult, MonthView } from '#lib/api/member-types.js';
import BookMonth from './BookMonth.svelte';

type Call = { method: string; url: string; body: unknown };

function stubApi(...responses: Response[]) {
	const calls: Call[] = [];
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string, init: RequestInit = {}) => {
			calls.push({
				method: init.method ?? 'GET',
				url,
				body: init.body ? JSON.parse(String(init.body)) : undefined
			});
			return responses.shift() ?? Response.json({ booked: [], skipped: [] });
		})
	);
	return calls;
}

afterEach(() => vi.unstubAllGlobals());

const date = (d: string, reason = '') => ({ date: d, canBook: reason === '', reason });

const view = (lessonsPerMonth: number | null = 12): MonthView => ({
	month: '2026-12',
	days: [
		{
			weekday: 6,
			times: [
				{
					start: '18:00',
					end: '18:30',
					dates: [date('2026-12-05'), date('2026-12-12'), date('2026-12-26')]
				},
				{ start: '19:00', end: '19:30', dates: [date('2026-12-05'), date('2026-12-12', 'full')] },
				{
					start: '20:00',
					end: '20:30',
					dates: [date('2026-12-05', 'full'), date('2026-12-12', 'full')]
				}
			]
		},
		{
			weekday: 1,
			times: [
				{
					start: '19:00',
					end: '19:30',
					dates: [date('2026-12-07'), date('2026-12-14', 'full'), date('2026-12-21')]
				}
			]
		}
	],
	closed: [{ date: '2026-12-19', reason: 'Spring show' }],
	current: [{ weekday: 6, start: '18:00' }],
	limit: { lessonsPerMonth, booked: 0, monthUnpaid: false }
});

const props = (v: MonthView, onbooked = vi.fn()) => ({
	view: v,
	memberId: 'm1',
	rider: 'Layla Hassan',
	locale: 'en' as const,
	onbooked
});

describe('BookMonth', () => {
	it("starts on the rider's usual times and counts as times are tapped", async () => {
		const screen = render(BookMonth, props(view()));

		await expect
			.element(screen.getByRole('button', { name: '18:00 3 of 3' }).first())
			.toHaveAttribute('aria-pressed', 'true');
		await expect.element(screen.getByText("Set to Layla's days", { exact: false })).toBeVisible();
		await expect.element(screen.getByText('Spring show', { exact: false })).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Book 3 sessions' })).toBeVisible();

		await screen.getByRole('button', { name: '19:00 2 of 3' }).click();

		await expect.element(screen.getByRole('button', { name: 'Book 5 sessions' })).toBeVisible();
		await expect.element(screen.getByRole('button', { name: '20:00 0 of 2' })).toBeDisabled();
	});

	it('lists only the dates that need a look', async () => {
		const screen = render(BookMonth, props(view()));
		await screen.getByRole('button', { name: '19:00 2 of 3' }).click();

		const check = screen.getByRole('region', { name: 'Check before booking' });
		await expect.element(check.getByText("Full · Won't be booked")).toBeVisible();
		expect(check.getByRole('listitem').elements()).toHaveLength(1);
	});

	it('marks dates past the plan and books them only after Book anyway', async () => {
		const result: MonthResult = {
			booked: [
				{ date: '2026-12-05', start: '18:00' },
				{ date: '2026-12-12', start: '18:00' },
				{ date: '2026-12-26', start: '18:00' }
			],
			skipped: []
		};
		const calls = stubApi(Response.json(result));
		const onbooked = vi.fn();
		const screen = render(BookMonth, props(view(2), onbooked));

		const check = screen.getByRole('region', { name: 'Check before booking' });
		await expect
			.element(check.getByText('Monthly limit reached (2) · Booked only if you confirm'))
			.toBeVisible();
		await screen.getByRole('button', { name: 'Book 3 sessions' }).click();
		await expect
			.element(screen.getByText("Monthly limit reached: 1 session over the plan's 2"))
			.toBeVisible();
		await screen.getByRole('button', { name: 'Book anyway' }).click();

		await vi.waitFor(() => expect(onbooked).toHaveBeenCalledWith(result));
		expect(calls).toEqual([
			{
				method: 'POST',
				url: '/api/academy/members/m1/month-bookings',
				body: { month: '2026-12', days: [{ weekday: 6, start: '18:00' }], confirm: true }
			}
		]);
	});

	it('shows the warnings the server finds and books after Book anyway', async () => {
		const calls = stubApi(
			Response.json(
				{ code: 'warning_required', warnings: ['month_unpaid'] },
				{ status: 409, headers: { 'content-type': 'application/problem+json' } }
			),
			Response.json({ booked: [], skipped: [] })
		);
		const screen = render(BookMonth, props(view()));

		await screen.getByRole('button', { name: 'Book 3 sessions' }).click();
		await screen.getByRole('button', { name: 'Yes, book it' }).click();
		await expect.element(screen.getByText('Month not paid')).toBeVisible();
		await screen.getByRole('button', { name: 'Book anyway' }).click();

		await vi.waitFor(() => expect(calls).toHaveLength(2));
		expect(calls.map((c) => (c.body as { confirm: boolean }).confirm)).toEqual([false, true]);
	});
});
