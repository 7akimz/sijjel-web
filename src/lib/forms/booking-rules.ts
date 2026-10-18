import type { BookingRules } from '#lib/api/academy-types.js';
import type { FieldErrors } from '#lib/api/errors.js';

const LIMITS: Record<keyof BookingRules, [number, number]> = {
	bookingWindowDays: [1, 90],
	bookingClosesHours: [0, 168],
	cancellationCutoffHours: [0, 168]
};

export function bookingRulesErrors(rules: BookingRules): FieldErrors {
	const errors: FieldErrors = {};
	for (const [field, [min, max]] of Object.entries(LIMITS) as [
		keyof BookingRules,
		[number, number]
	][]) {
		const value = rules[field];
		if (!Number.isInteger(value) || value < min || value > max)
			errors[field] = ['booking_rule_invalid'];
	}
	return errors;
}
