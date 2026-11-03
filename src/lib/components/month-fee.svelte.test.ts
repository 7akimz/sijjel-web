import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MonthFee from './MonthFee.svelte';

const props = { month: '2026-11', amount: 2200, currency: 'EGP', locale: 'en' as const };

describe('MonthFee', () => {
	it('shows an unpaid month with its fee, and marks it paid when pressed', async () => {
		const onchange = vi.fn();
		const screen = render(MonthFee, { ...props, paid: false, onchange });

		const fee = screen.getByRole('button', { name: 'Mark November paid' });
		await expect.element(fee).toHaveAttribute('aria-pressed', 'false');
		await expect.element(fee).toHaveTextContent(/November/);
		await expect.element(fee).toHaveTextContent(/2,200/);
		await expect.element(fee).toHaveTextContent(/Not paid/);
		await fee.click();

		expect(onchange).toHaveBeenCalledWith(true);
	});

	it('shows a paid month, and can be pressed again to undo', async () => {
		const onchange = vi.fn();
		const screen = render(MonthFee, { ...props, paid: true, onchange });

		const fee = screen.getByRole('button', { name: 'Mark November not paid' });
		await expect.element(fee).toHaveAttribute('aria-pressed', 'true');
		await expect.element(fee).toHaveTextContent(/Paid/);
		await fee.click();

		expect(onchange).toHaveBeenCalledWith(false);
	});

	it('leaves the amount out when the member has no plan', async () => {
		const screen = render(MonthFee, { ...props, amount: null, paid: false, onchange: vi.fn() });

		await expect
			.element(screen.getByRole('button', { name: 'Mark November paid' }))
			.not.toHaveTextContent(/EGP|2,200/);
	});
});
