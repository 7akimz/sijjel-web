import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { DateRangeField, TimeRangeField } from './index';

describe('TimeRangeField', () => {
	it('keeps times left-to-right as time inputs', () => {
		const { container } = render(TimeRangeField, {
			label: 'Saturday',
			opens: '18:00',
			closes: '22:00'
		});

		const inputs = [...container.querySelectorAll('input')];
		expect(inputs).toHaveLength(2);
		for (const input of inputs) {
			expect(input.getAttribute('type')).toBe('time');
			expect(input.getAttribute('dir')).toBe('ltr');
		}
	});
});

describe('DateRangeField', () => {
	it('fills the end date from the start date', async () => {
		const screen = render(DateRangeField, { label: 'Closed', from: '', to: '' });

		await screen.getByLabelText('Closed from').fill('2026-04-01');

		await expect.element(screen.getByLabelText('Closed to')).toHaveValue('2026-04-01');
	});
});
