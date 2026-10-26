import { describe, expect, it } from 'vitest';
import { ApiError } from '#lib/api/errors.js';
import type { PlanSummary, SlotView } from '#lib/api/member-types.js';
import {
	bookingErrorText,
	groupByDate,
	riderBlockReason,
	riderBlockText,
	shiftWeek,
	slotReasonText,
	warningTexts,
	weekStartOf
} from './booking';

const summary = (overrides: Partial<PlanSummary> = {}): PlanSummary => ({
	plan: {
		id: 'p',
		nameEn: 'Two',
		nameAr: 'اثنتان',
		lessonsPerMonth: 2,
		monthlyPrice: 1000,
		discipline: null,
		isActive: true
	},
	currency: 'EGP',
	lessonsPerMonth: 2,
	usedThisMonth: 0,
	leftThisMonth: 2,
	monthStart: '2026-10-01',
	monthEnd: '2026-10-31',
	paidThisMonth: true,
	unpaidBooking: 'allow',
	horseSource: 'school',
	hasOwnHorse: false,
	...overrides
});

const slot = (date: string, start: string): SlotView => ({
	date,
	start,
	end: start,
	placesLeft: 2,
	canBook: true,
	reason: '',
	suitableHorsesFree: 1,
	suitableHorsesTotal: 1,
	booked: false,
	bookingId: null
});

describe('weeks', () => {
	it('starts weeks on Saturday', () => {
		expect(weekStartOf('2026-10-19')).toBe('2026-10-17');
		expect(weekStartOf('2026-10-31')).toBe('2026-10-31');
		expect(shiftWeek('2026-10-17', 1)).toBe('2026-10-24');
		expect(shiftWeek('2026-10-31', -1)).toBe('2026-10-24');
	});
});

describe('groupByDate', () => {
	it('keeps days and times in order', () => {
		const days = groupByDate([
			slot('2026-10-19', '18:00'),
			slot('2026-10-19', '18:30'),
			slot('2026-10-20', '18:00')
		]);

		expect(days.map((d) => d.date)).toEqual(['2026-10-19', '2026-10-20']);
		expect(days[0].slots).toHaveLength(2);
	});
});

describe('reasons', () => {
	it('explains a slot in plain words and reuses that for booking errors', () => {
		expect(slotReasonText('monthly_limit', 'en')).toBe('Monthly limit reached');
		expect(bookingErrorText(new ApiError(409, 'no_suitable_school_horse'), 'en')).toBe(
			'No suitable school horse is free at this time.'
		);
	});
});

describe('riderBlockReason', () => {
	it('says why a rider cannot book at all', () => {
		expect(riderBlockReason(null)).toBe('no_plan');
		expect(riderBlockReason(summary({ plan: null }))).toBe('no_plan');
		expect(riderBlockReason(summary({ unpaidBooking: 'block', paidThisMonth: false }))).toBe(
			'month_unpaid'
		);
		expect(riderBlockReason(summary({ paidThisMonth: false }))).toBeNull();
		expect(riderBlockReason(summary({ horseSource: 'own' }))).toBe('no_own_horse');
		expect(riderBlockReason(summary({ horseSource: 'own', hasOwnHorse: true }))).toBeNull();
		expect(riderBlockText('no_own_horse', 'en')).toBe(
			"Your horse isn't registered yet. Ask the academy to add it before you book."
		);
	});
});

describe('warningTexts', () => {
	it('lists what staff are asked to confirm', () => {
		const e = new ApiError(
			409,
			'warning_required',
			{},
			{ warnings: ['monthly_limit', 'month_unpaid'] }
		);

		expect(warningTexts(e, 'en')).toEqual(['Monthly limit reached', 'Month not paid']);
		expect(warningTexts(new ApiError(409, 'full'), 'en')).toBeNull();
	});
});
