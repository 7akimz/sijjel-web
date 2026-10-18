import { describe, expect, it } from 'vitest';
import { bookingRulesErrors, wholeNumber } from './booking-rules';

const rules = {
	bookingWindowDays: 14,
	bookingClosesHours: 0,
	cancellationCutoffHours: 12,
	currency: 'EGP',
	unpaidBooking: 'allow' as const,
	minRiderAge: 6,
	maxRiderAge: null,
	countryCallingCode: '20',
	maxRiderWeightKg: null
};

describe('bookingRulesErrors', () => {
	it('accepts the defaults', () => {
		expect(bookingRulesErrors(rules)).toEqual({});
	});

	it('mirrors the API ranges and wants whole numbers', () => {
		expect(bookingRulesErrors({ ...rules, bookingWindowDays: 0 })).toEqual({
			bookingWindowDays: ['booking_rule_invalid']
		});
		expect(bookingRulesErrors({ ...rules, bookingWindowDays: 91 })).toEqual({
			bookingWindowDays: ['booking_rule_invalid']
		});
		expect(bookingRulesErrors({ ...rules, bookingClosesHours: 1.5 })).toEqual({
			bookingClosesHours: ['booking_rule_invalid']
		});
		expect(bookingRulesErrors({ ...rules, cancellationCutoffHours: 169 })).toEqual({
			cancellationCutoffHours: ['booking_rule_invalid']
		});
	});
});

describe('wholeNumber', () => {
	it('treats a cleared field as missing rather than zero', () => {
		expect(wholeNumber('')).toBeNaN();
		expect(wholeNumber(null)).toBeNaN();
		expect(wholeNumber('  ')).toBeNaN();
		expect(wholeNumber('12')).toBe(12);
		expect(wholeNumber(0)).toBe(0);
	});

	it('makes a cleared field invalid', () => {
		expect(bookingRulesErrors({ ...rules, cancellationCutoffHours: wholeNumber('') })).toEqual({
			cancellationCutoffHours: ['booking_rule_invalid']
		});
	});
});

describe('member settings', () => {
	it('validates currency, age range, calling code and weight limit', () => {
		expect(bookingRulesErrors({ ...rules, currency: 'egp' })).toEqual({
			currency: ['currency_invalid']
		});
		expect(bookingRulesErrors({ ...rules, minRiderAge: 10, maxRiderAge: 8 })).toEqual({
			maxRiderAge: ['age_range_invalid']
		});
		expect(bookingRulesErrors({ ...rules, countryCallingCode: '2001' })).toEqual({
			countryCallingCode: ['phone_invalid']
		});
		expect(bookingRulesErrors({ ...rules, maxRiderWeightKg: 15 })).toEqual({
			maxRiderWeightKg: ['weight_range_invalid']
		});
		expect(bookingRulesErrors({ ...rules, maxRiderWeightKg: 80, maxRiderAge: 18 })).toEqual({});
	});
});
