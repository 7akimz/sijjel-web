import { describe, expect, it } from 'vitest';
import { closedRangeErrors, formatRange, isPast, toDateRangeInput } from './closed-dates';

describe('closedRangeErrors', () => {
	it('accepts a range with an optional reason', () => {
		expect(closedRangeErrors({ from: '2026-03-30', to: '2026-04-01', reason: 'Eid' })).toEqual({});
		expect(closedRangeErrors({ from: '2026-04-01', to: '2026-04-01', reason: '' })).toEqual({});
	});

	it('rejects missing or reversed dates and long reasons', () => {
		expect(closedRangeErrors({ from: '2026-04-02', to: '2026-04-01', reason: '' })).toEqual({
			to: ['date_range_invalid']
		});
		expect(closedRangeErrors({ from: '', to: '2026-04-01', reason: '' })).toEqual({
			from: ['date_range_invalid']
		});
		expect(
			closedRangeErrors({ from: '2026-04-01', to: '2026-04-01', reason: 'x'.repeat(121) })
		).toEqual({
			reason: ['reason_too_long']
		});
	});
});

describe('isPast', () => {
	it('counts a range as past only after its last day', () => {
		const range = { id: 'r', from: '2026-10-16', to: '2026-10-17', reason: null };

		expect(isPast(range, '2026-10-18')).toBe(true);
		expect(isPast(range, '2026-10-17')).toBe(false);
	});
});

describe('formatRange', () => {
	it('shows one date for a single day and both ends otherwise', () => {
		expect(formatRange({ from: '2026-04-01', to: '2026-04-01' }, 'en')).toBe('1 April 2026');
		expect(formatRange({ from: '2026-03-30', to: '2026-04-01' }, 'en')).toBe(
			'30 March 2026 – 1 April 2026'
		);
	});
});

describe('toDateRangeInput', () => {
	it('sends confirm only when the admin agreed to cancel bookings', () => {
		const form = { from: '2026-10-20', to: '2026-10-20', reason: '' };

		expect(toDateRangeInput(form, true)).toEqual({
			from: '2026-10-20',
			to: '2026-10-20',
			reason: null,
			confirm: true
		});
		expect(toDateRangeInput(form)).not.toHaveProperty('confirm');
	});
});
