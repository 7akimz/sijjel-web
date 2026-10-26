import { describe, expect, it } from 'vitest';
import type { Member } from '#lib/api/member-types.js';
import { memberErrors, memberFormFrom, monthKey, nextMonth, toMemberInput } from './member';

const rules = { minRiderAge: 6, maxRiderAge: null, maxRiderWeightKg: null };

const layla: Member = {
	id: 'm1',
	displayName: 'Layla',
	email: 'layla@a.test',
	roles: ['rider'],
	status: 'active',
	phone: '201012345678',
	age: 14,
	weightKg: 52,
	discipline: { id: 'd', key: 'dressage', nameEn: 'Dressage', nameAr: 'ترويض' },
	level: { id: 'l1', nameEn: 'Intro', nameAr: 'تمهيدي', position: 1 },
	plan: {
		id: 'p',
		nameEn: 'Two',
		nameAr: 'اثنتان',
		lessonsPerMonth: 2,
		monthlyPrice: 1000,
		discipline: null,
		isActive: true
	},
	horseSource: 'school',
	privateHorse: null,
	paidThisMonth: false,
	upcomingBookings: 0,
	comingMove: null,
	comingPlan: null
};

describe('months', () => {
	it('reads the month of a date and the month after', () => {
		expect(monthKey('2026-10-19')).toBe('2026-10');
		expect(nextMonth('2026-10')).toBe('2026-11');
		expect(nextMonth('2026-12')).toBe('2027-01');
	});
});

describe('member form', () => {
	it('round-trips a rider', () => {
		expect(toMemberInput(memberFormFrom(layla))).toEqual({
			displayName: 'Layla',
			roles: ['rider'],
			phone: '201012345678',
			age: 14,
			weightKg: 52,
			disciplineId: 'd',
			levelId: 'l1',
			planId: 'p',
			horseSource: 'school'
		});
	});

	it('needs the rider fields once the rider role is added', () => {
		const owner = memberFormFrom({ ...layla, roles: ['admin'], plan: null, age: null });

		expect(memberErrors({ ...owner, roles: ['admin', 'rider'] }, rules)).toMatchObject({
			planId: ['plan_required']
		});
		expect(memberErrors(owner, rules)).toEqual({});
	});

	it('sends no rider fields for staff', () => {
		const input = toMemberInput({ ...memberFormFrom(layla), roles: ['trainer'] });

		expect(input).toEqual({ displayName: 'Layla', roles: ['trainer'], phone: '201012345678' });
	});
});
