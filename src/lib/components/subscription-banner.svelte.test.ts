import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Membership } from '#lib/api/types.js';
import SubscriptionBanner from './SubscriptionBanner.svelte';

const membership = (extra: Partial<Membership>): Membership => ({
	roles: ['admin'],
	status: 'active',
	discipline: null,
	level: null,
	setupDone: true,
	bookingPaused: false,
	...extra
});

describe('SubscriptionBanner', () => {
	it('shows an admin how long they have gone unpaid', async () => {
		const screen = render(SubscriptionBanner, {
			membership: membership({
				subscription: {
					status: 'unpaid',
					paidUntil: '2026-10-15',
					monthsUnpaid: 2,
					amountUnpaid: 3000,
					blocked: false
				}
			}),
			locale: 'en'
		});
		await expect
			.element(
				screen.getByText(
					'Unpaid: 2 months · EGP 3,000. Your sijjel subscription was due on 15 October 2026.'
				)
			)
			.toBeVisible();
		await expect
			.element(screen.getByText('Pay by InstaPay or cash and let us know.'))
			.toBeVisible();
	});

	it('due soon reads the date', async () => {
		const screen = render(SubscriptionBanner, {
			membership: membership({
				subscription: {
					status: 'due_soon',
					paidUntil: '2026-11-17',
					monthsUnpaid: 0,
					amountUnpaid: 0,
					blocked: false
				}
			}),
			locale: 'en'
		});
		await expect
			.element(screen.getByText('Your sijjel subscription is due on 17 November 2026.'))
			.toBeVisible();
	});

	it('tells a blocked academy admin booking is paused', async () => {
		const screen = render(SubscriptionBanner, {
			membership: membership({
				bookingPaused: true,
				subscription: {
					status: 'paid',
					paidUntil: '2026-12-15',
					monthsUnpaid: 0,
					amountUnpaid: 0,
					blocked: true
				}
			}),
			locale: 'en'
		});
		await expect
			.element(
				screen.getByText(
					'Booking is paused at your academy until your sijjel subscription is paid.'
				)
			)
			.toBeVisible();
	});

	it('riders see only that booking is paused', async () => {
		const screen = render(SubscriptionBanner, {
			membership: membership({ roles: ['rider'], bookingPaused: true }),
			locale: 'en'
		});
		await expect
			.element(screen.getByText('Booking is paused at this academy. Please contact the academy.'))
			.toBeVisible();
		expect(screen.container.textContent).not.toMatch(/subscription|InstaPay/);
	});

	it('shows nothing without a package', async () => {
		const screen = render(SubscriptionBanner, { membership: membership({}), locale: 'en' });
		expect(screen.container.textContent?.trim()).toBe('');
	});
});
