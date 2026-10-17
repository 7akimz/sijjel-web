import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { DateRangeField, TimeRangeField } from './index';

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
