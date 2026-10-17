import { describe, expect, it } from 'vitest';
import ar from '../../messages/ar.json';
import en from '../../messages/en.json';

const academySetupErrors = [
	'not_an_admin',
	'hours_invalid',
	'session_length_invalid',
	'break_invalid',
	'booking_rule_invalid',
	'capacity_invalid',
	'arena_name_taken',
	'arena_not_found',
	'date_range_invalid',
	'reason_too_long',
	'closed_dates_overlap',
	'closed_date_not_found',
	'discipline_in_use',
	'last_discipline',
	'discipline_already_enabled',
	'level_in_use',
	'level_range_inverted',
	'level_unknown',
	'horse_name_taken',
	'level_range_invalid',
	'sessions_per_day_invalid',
	'notes_too_long',
	'horse_not_found',
	'unavailability_not_found'
];

describe('messages', () => {
	it('translates every academy setup error code in both languages', () => {
		for (const code of academySetupErrors) {
			expect(en, code).toHaveProperty(`error_${code}`);
			expect(ar, code).toHaveProperty(`error_${code}`);
		}
	});

	it('has the same keys in English and Arabic', () => {
		expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
	});
});
