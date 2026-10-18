import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ClosedDatesPage from './+page.svelte';

const affected = {
	code: 'bookings_affected',
	bookings: [{ id: 'b1', riderName: 'Layla', date: '2026-10-20', startTime: '18:00' }]
};

afterEach(() => vi.unstubAllGlobals());

describe('closed dates page', () => {
	it('cancels only the range whose bookings the admin was shown', async () => {
		const bodies: unknown[] = [];
		vi.stubGlobal(
			'fetch',
			vi.fn(async (_url: string, init: RequestInit) => {
				const body = JSON.parse(String(init.body));
				bodies.push(body);
				if (!body.confirm) return Response.json(affected, { status: 409 });
				return Response.json({ id: 'c1', ...body }, { status: 201 });
			})
		);
		const screen = render(ClosedDatesPage, {
			data: { closures: [], today: '2026-10-18', locale: 'en' },
			params: {}
		} as never);

		await screen.getByLabelText('Closed from').fill('2026-10-20');
		await screen.getByLabelText('Closed to').fill('2026-10-21');
		await screen.getByRole('button', { name: 'Add closed dates' }).click();
		await expect.element(screen.getByText(/Layla/)).toBeVisible();
		await screen.getByLabelText('Closed to').fill('2026-10-25');
		await screen.getByRole('button', { name: 'Close these days and cancel the bookings' }).click();

		await vi.waitFor(() => expect(bodies).toHaveLength(2));
		expect(bodies[1]).toMatchObject({ from: '2026-10-20', to: '2026-10-21', confirm: true });
	});
});
