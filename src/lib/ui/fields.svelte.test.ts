import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { DateRangeField, TextField, TimeRangeField } from './index';

describe('TimeRangeField', () => {
	it('keeps 24-hour times left-to-right whatever the browser locale', () => {
		const { container } = render(TimeRangeField, {
			label: 'Saturday',
			opens: '18:00',
			closes: '22:00'
		});

		const inputs = [...container.querySelectorAll('input')];
		expect(inputs).toHaveLength(2);
		for (const input of inputs) {
			expect(input.getAttribute('type')).toBe('text');
			expect(input.getAttribute('inputmode')).toBe('numeric');
			expect(input.getAttribute('dir')).toBe('ltr');
		}
		expect(inputs[0].value).toBe('18:00');
	});

	it('tidies a typed time when leaving the field', async () => {
		const screen = render(TimeRangeField, { label: 'Saturday', opens: '', closes: '' });
		const opens = screen.getByLabelText('Saturday opens');

		await opens.fill('930');
		await screen.getByLabelText('Saturday closes').click();

		await expect.element(opens).toHaveValue('09:30');
	});
});

describe('DateRangeField', () => {
	it('fills the end date from the start date', async () => {
		const screen = render(DateRangeField, { label: 'Closed', from: '', to: '' });

		await screen.getByLabelText('Closed from').fill('2026-04-01');

		await expect.element(screen.getByLabelText('Closed to')).toHaveValue('2026-04-01');
	});
});

describe('TextField', () => {
	it('shows and hides a password', async () => {
		const screen = render(TextField, { label: 'Password', type: 'password', value: 'secret' });
		const input = screen.getByLabelText('Password', { exact: true });

		await expect.element(input).toHaveAttribute('type', 'password');
		await screen.getByRole('button', { name: 'Show password' }).click();
		await expect.element(input).toHaveAttribute('type', 'text');
		await screen.getByRole('button', { name: 'Hide password' }).click();
		await expect.element(input).toHaveAttribute('type', 'password');
		await expect.element(input).toHaveValue('secret');
	});

	it('has no show button on other fields', () => {
		const screen = render(TextField, { label: 'Email', type: 'email' });
		expect(screen.container.querySelector('button')).toBeNull();
	});

	it('gives a phone field the phone keypad and keeps it left to right', () => {
		const { container } = render(TextField, { label: 'Phone', type: 'tel', dir: 'ltr' });

		expect(container.querySelector('input[type=tel][inputmode=tel][dir=ltr]')).not.toBeNull();
	});
});
