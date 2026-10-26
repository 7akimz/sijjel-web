import { describe, expect, it } from 'vitest';
import type { Member } from '#lib/api/member-types.js';
import {
	formAfterMove,
	isLevelledRider,
	memberErrors,
	memberFormFrom,
	monthKey,
	nextMonth,
	planHint,
	toMemberInput
} from './member';

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

describe('planHint', () => {
	const improver = { ...layla.plan!, id: 'p2', nameEn: 'Improver' };

	it('says when a newly picked plan starts', () => {
		expect(planHint('p2', layla, '2026-10-27', 'en')).toBe('Starts on 1 November 2026');
	});

	it('shows a saved coming plan while the current one is selected', () => {
		const coming = { ...layla, comingPlan: { plan: improver, from: '2026-11-01' } };

		expect(planHint('p', coming, '2026-10-27', 'en')).toBe('Plan changes to Improver on 1 Nov');
	});

	it('says nothing when the plan stays', () => {
		expect(planHint('p', layla, '2026-10-27', 'en')).toBeUndefined();
	});
});

describe('planHint for a rider with no plan', () => {
	it('says nothing, since the plan starts at once', () => {
		expect(planHint('p', { ...layla, plan: null }, '2026-10-27', 'en')).toBeUndefined();
	});
});

describe('formAfterMove', () => {
	const moved: Member = {
		...layla,
		level: { id: 'l2', nameEn: 'Preliminary', nameAr: 'أولي', position: 2 }
	};

	it('takes the new level and keeps the plan the form had unchanged', () => {
		const form = formAfterMove(memberFormFrom(layla), layla, moved);

		expect(form.levelId).toBe('l2');
		expect(form.planId).toBe('p');
	});

	it('keeps a plan picked but not saved yet', () => {
		const form = formAfterMove({ ...memberFormFrom(layla), planId: 'p2' }, layla, moved);

		expect(form.planId).toBe('p2');
	});
});

describe('isLevelledRider', () => {
	it('needs the rider role, a discipline and a level', () => {
		expect(isLevelledRider(layla)).toBe(true);
		expect(isLevelledRider({ ...layla, level: null })).toBe(false);
		expect(isLevelledRider({ ...layla, roles: ['trainer'] })).toBe(false);
	});
});
