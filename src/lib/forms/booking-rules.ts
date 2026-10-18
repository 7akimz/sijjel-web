import type { BookingRules } from '#lib/api/academy-types.js';
import type { FieldErrors } from '#lib/api/errors.js';

const TIMING_LIMITS = {
	bookingWindowDays: [1, 90],
	bookingClosesHours: [0, 168],
	cancellationCutoffHours: [0, 168]
} as const;

const inRange = (value: number, min: number, max: number) =>
	Number.isInteger(value) && value >= min && value <= max;

// wholeNumber reads a number field, treating a cleared field as missing rather than zero.
export function wholeNumber(value: string | number | null | undefined): number {
	if (value === null || value === undefined || String(value).trim() === '') return Number.NaN;
	return Number(value);
}

export function bookingRulesErrors(rules: BookingRules): FieldErrors {
	const errors: FieldErrors = {};
	for (const [field, [min, max]] of Object.entries(TIMING_LIMITS) as [
		keyof typeof TIMING_LIMITS,
		readonly [number, number]
	][]) {
		if (!inRange(rules[field], min, max)) errors[field] = ['booking_rule_invalid'];
	}
	if (!/^[A-Z]{3}$/.test(rules.currency)) errors.currency = ['currency_invalid'];
	if (!inRange(rules.minRiderAge, 3, 99)) errors.minRiderAge = ['age_range_invalid'];
	const maxAge = rules.maxRiderAge;
	if (maxAge !== null && !inRange(maxAge, Math.max(rules.minRiderAge, 3), 120)) {
		errors.maxRiderAge = ['age_range_invalid'];
	}
	if (!/^[0-9]{1,3}$/.test(rules.countryCallingCode)) errors.countryCallingCode = ['phone_invalid'];
	const weight = rules.maxRiderWeightKg;
	if (weight !== null && !inRange(weight, 20, 200))
		errors.maxRiderWeightKg = ['weight_range_invalid'];
	return errors;
}
