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
	'unavailability_not_found',
	'setup_incomplete',
	'age_out_of_range',
	'weight_out_of_range',
	'weight_range_invalid',
	'plan_required',
	'plan_not_found',
	'price_invalid',
	'sessions_per_week_invalid',
	'currency_invalid',
	'age_range_invalid',
	'phone_invalid',
	'member_not_found',
	'month_invalid',
	'not_a_rider',
	'not_staff',
	'not_a_member',
	'member_suspended',
	'role_invalid',
	'horse_source_invalid',
	'bookings_affected',
	'last_admin',
	'booking_not_found',
	'cancel_too_late',
	'warning_required',
	'slot_invalid',
	'closed',
	'past',
	'too_soon',
	'outside_window',
	'full',
	'already_booked',
	'weekly_limit',
	'month_unpaid',
	'no_plan',
	'no_suitable_school_horse',
	'own_horse_busy',
	'no_own_horse'
];

const boardErrors = [
	'session_past',
	'session_not_found',
	'own_horse_rider',
	'horse_unavailable',
	'horse_unsuitable',
	'horse_taken',
	'horse_resting',
	'arena_full',
	'trainer_not_found',
	'note_too_long',
	'date_invalid'
];

const boardProblems = [
	'horse_unavailable',
	'horse_unsuitable',
	'arena_full',
	'arena_inactive',
	'no_workable_horse'
];

const slotReasons = [
	'past',
	'too_soon',
	'outside_window',
	'full',
	'already_booked',
	'weekly_limit',
	'month_unpaid',
	'no_plan',
	'no_suitable_school_horse',
	'own_horse_busy',
	'no_own_horse'
];

describe('messages', () => {
	it('translates every academy setup error code in both languages', () => {
		for (const code of academySetupErrors) {
			expect(en, code).toHaveProperty(`error_${code}`);
			expect(ar, code).toHaveProperty(`error_${code}`);
		}
	});

	it('explains every slot reason in both languages', () => {
		for (const reason of slotReasons) {
			expect(en, reason).toHaveProperty(`slot_reason_${reason}`);
			expect(ar, reason).toHaveProperty(`slot_reason_${reason}`);
		}
	});

	it('translates every planning board error and problem in both languages', () => {
		for (const code of boardErrors) {
			expect(en, code).toHaveProperty(`error_${code}`);
			expect(ar, code).toHaveProperty(`error_${code}`);
		}
		for (const problem of boardProblems) {
			expect(en, problem).toHaveProperty(`board_problem_${problem}`);
			expect(ar, problem).toHaveProperty(`board_problem_${problem}`);
		}
	});

	it('has the same keys in English and Arabic', () => {
		expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
	});
});
