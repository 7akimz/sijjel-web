import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AffectedBookings from './AffectedBookings.svelte';

describe('AffectedBookings', () => {
	it('lists the bookings and confirms', async () => {
		const onconfirm = vi.fn();
		const screen = render(AffectedBookings, {
			bookings: [
				{ id: 'b1', riderName: 'Layla', date: '2026-10-20', startTime: '18:00' },
				{ id: 'b2', riderName: 'Sara', date: '2026-10-21', startTime: '19:30' }
			],
			locale: 'en',
			confirmLabel: 'Cancel them',
			onconfirm,
			oncancel: () => {}
		});

		await expect.element(screen.getByText('Layla · 20 October 2026 18:00')).toBeVisible();
		await expect.element(screen.getByText('Sara · 21 October 2026 19:30')).toBeVisible();
		await screen.getByRole('button', { name: 'Cancel them' }).click();
		expect(onconfirm).toHaveBeenCalledOnce();
	});
});
