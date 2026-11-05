import { describe, expect, it } from 'vitest';
import type { Member } from '#lib/api/member-types.js';
import {
	isLevelledRider,
	isStaffOnly,
	memberErrors,
	memberFormFrom,
	monthKey,
	nextMonth,
	planHint,
	profileChips,
	toMemberInput,
	inactiveLabel,
	alreadyMemberText
} from './member';

const layla: Member = {
	id: 'm1',
	displayName: 'Layla',
	email: 'layla@a.test',
	roles: ['rider'],
	status: 'active',
	phone: '201012345678',
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
	it('never sends the phone, which riders change from their account', () => {
		expect(toMemberInput(memberFormFrom(layla))).not.toHaveProperty('phone');
		expect(toMemberInput({ ...memberFormFrom(layla), roles: ['trainer'] })).not.toHaveProperty(
			'phone'
		);
	});

	it('sends no name, age or weight, which belong to the rider', () => {
		expect(toMemberInput(memberFormFrom(layla))).toEqual({
			roles: ['rider'],
			disciplineId: 'd',
			levelId: 'l1',
			planId: 'p',
			horseSource: 'school'
		});
	});

	it('needs the rider fields once the rider role is added', () => {
		const owner = memberFormFrom({ ...layla, roles: ['admin'], plan: null });

		expect(memberErrors({ ...owner, roles: ['admin', 'rider'] })).toMatchObject({
			planId: ['plan_required']
		});
		expect(memberErrors(owner)).toEqual({});
	});

	it('sends no rider fields for staff', () => {
		const input = toMemberInput({ ...memberFormFrom(layla), roles: ['trainer'] });

		expect(input).toEqual({ roles: ['trainer'] });
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

describe('isLevelledRider', () => {
	it('needs the rider role, a discipline and a level', () => {
		expect(isLevelledRider(layla)).toBe(true);
		expect(isLevelledRider({ ...layla, level: null })).toBe(false);
		expect(isLevelledRider({ ...layla, roles: ['trainer'] })).toBe(false);
	});
});

describe('isStaffOnly', () => {
	it('is an admin or trainer who does not ride', () => {
		expect(isStaffOnly({ ...layla, roles: ['admin'] })).toBe(true);
		expect(isStaffOnly({ ...layla, roles: ['trainer', 'admin'] })).toBe(true);
		expect(isStaffOnly({ ...layla, roles: ['trainer', 'rider'] })).toBe(false);
		expect(isStaffOnly(layla)).toBe(false);
	});
});

describe('inactiveLabel', () => {
	it('names a member who left apart from a suspended one, and says nothing for active members', () => {
		expect(inactiveLabel('left')).toBe('Left');
		expect(inactiveLabel('suspended')).toBe('Suspended');
		expect(inactiveLabel('active')).toBeNull();
	});
});

describe('alreadyMemberText', () => {
	it('points someone who left or was suspended to reactivation instead of saying all is well', () => {
		expect(alreadyMemberText('active')).toBe(
			"You're already a member, so the invitation wasn't needed."
		);
		expect(alreadyMemberText('left')).toBe(
			'You already have a membership here. Ask the academy to reactivate it.'
		);
		expect(alreadyMemberText('suspended')).toBe(
			'You already have a membership here. Ask the academy to reactivate it.'
		);
	});
});

describe('profileChips', () => {
	it("gives a rider's level first, then plan and own horse, without the rider role", () => {
		const own = {
			...layla,
			horseSource: 'own' as const,
			privateHorse: { id: 'h', name: 'Zahra', notes: null, isActive: true }
		};

		expect(profileChips(own, 'en')).toEqual([
			{ text: 'Dressage · Intro', tone: 'level' },
			{ text: 'Two', tone: 'neutral' },
			{ text: 'Own horse: Zahra', tone: 'neutral' }
		]);
	});

	it('names staff roles after the level, and leaves out a retired horse', () => {
		const staff = {
			...layla,
			roles: ['admin', 'rider'] as Member['roles'],
			horseSource: 'own' as const,
			privateHorse: { id: 'h', name: 'Zahra', notes: null, isActive: false }
		};

		expect(profileChips(staff, 'en')).toEqual([
			{ text: 'Dressage · Intro', tone: 'level' },
			{ text: 'Two', tone: 'neutral' },
			{ text: 'Admin', tone: 'neutral' }
		]);
	});
});
