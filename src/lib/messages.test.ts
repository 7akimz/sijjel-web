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
	'plan_required',
	'plan_not_found',
	'plan_not_for_rider',
	'plan_scheduled',
	'level_moves_only',
	'level_required',
	'level_unchanged',
	'start_invalid',
	'price_invalid',
	'lessons_per_month_invalid',
	'levels_need_discipline',
	'currency_invalid',
	'phone_invalid',
	'member_not_found',
	'month_invalid',
	'not_a_rider',
	'not_staff',
	'not_a_member',
	'member_suspended',
	'member_left',
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
	'monthly_limit',
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
	'date_invalid',
	'bookings_required',
	'bookings_mixed_sessions',
	'push_disabled',
	'subscription_invalid'
];

const boardProblems = [
	'horse_unavailable',
	'horse_unsuitable',
	'arena_full',
	'arena_inactive',
	'no_workable_horse'
];

const subscriptionErrors = [
	'academy_blocked',
	'blocked_required',
	'entry_not_latest',
	'rider_limit_reached',
	'package_required',
	'package_not_found',
	'max_riders_invalid',
	'price_invalid',
	'days_invalid',
	'amount_invalid',
	'method_invalid',
	'note_too_long',
	'from_today_invalid',
	'entry_not_found',
	'academy_not_found'
];

const slotReasons = [
	'academy_blocked',
	'past',
	'too_soon',
	'outside_window',
	'full',
	'already_booked',
	'monthly_limit',
	'month_unpaid',
	'no_plan',
	'no_suitable_school_horse',
	'own_horse_busy',
	'no_own_horse'
];

const reminderKeys = [
	'board_select',
	'board_select_done',
	'board_selected_count',
	'board_set_trainer',
	'board_same_as_arena',
	'reminders_title',
	'reminders_intro',
	'reminders_ios_install',
	'reminders_unsupported',
	'reminders_blocked',
	'reminders_turn_on',
	'reminders_on',
	'reminders_test',
	'reminders_test_sent',
	'reminders_test_none',
	'reminders_turn_off',
	'reminders_battery_tip'
];

const brandingErrors = ['image_invalid', 'image_too_large', 'color_invalid', 'welcome_too_long'];

const phoneIdentityKeys = [
	'field_identifier',
	'field_phone',
	'field_email_optional',
	'error_phone_taken',
	'error_phone_invalid',
	'error_phone_mismatch'
];

describe('messages', () => {
	it('has every phone identity message in both languages', () => {
		for (const key of phoneIdentityKeys) {
			expect(en, key).toHaveProperty(key);
			expect(ar, key).toHaveProperty(key);
		}
		expect(en.error_login_failed).toBe('The phone, email or password is wrong.');
	});

	it('translates every branding error code in both languages', () => {
		for (const code of brandingErrors) {
			expect(en, code).toHaveProperty(`error_${code}`);
			expect(ar, code).toHaveProperty(`error_${code}`);
		}
	});

	it('has every trainer group and reminders message in both languages', () => {
		for (const key of reminderKeys) {
			expect(en, key).toHaveProperty(key);
			expect(ar, key).toHaveProperty(key);
		}
	});

	it('translates every academy setup error code in both languages', () => {
		for (const code of academySetupErrors) {
			expect(en, code).toHaveProperty(`error_${code}`);
			expect(ar, code).toHaveProperty(`error_${code}`);
		}
	});

	it('translates every subscription error code in both languages', () => {
		for (const code of subscriptionErrors) {
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

	it('names a blocked academy calmly in Arabic', () => {
		expect(ar.subscription_blocked).toBe('الحجز موقوف');
	});

	it('has the same keys in English and Arabic', () => {
		expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
	});
});
