import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MonthPayment from './MonthPayment.svelte';

const props = { month: '2026-11', amount: 2200, currency: 'EGP', locale: 'en' as const };

describe('MonthPayment', () => {
	it('shows an unpaid month as waiting, with Mark paid', async () => {
		const onmarkpaid = vi.fn();
		const screen = render(MonthPayment, { ...props, onmarkpaid });

		await expect.element(screen.getByRole('heading', { name: 'This month' })).toBeVisible();
		await expect.element(screen.getByText('November')).toBeVisible();
		await expect.element(screen.getByText(/2,200/)).toBeVisible();
		await expect.element(screen.getByText('Not paid')).toHaveClass('sj-chip--pending');
		await screen.getByRole('button', { name: 'Mark paid' }).click();

		expect(onmarkpaid).toHaveBeenCalledOnce();
	});

	it('leaves the amount out when the member has no plan', async () => {
		const screen = render(MonthPayment, {
			...props,
			amount: null,
			onmarkpaid: vi.fn()
		});

		await expect.element(screen.getByText(/EGP|2,200/)).not.toBeInTheDocument();
	});
});
