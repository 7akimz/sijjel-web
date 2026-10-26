import type { AcademyDisciplines } from '#lib/api/academy-types.js';
import type { Member, Plan } from '#lib/api/member-types.js';

const flatwork = { id: 'flat', key: 'flatwork', nameEn: 'Flatwork', nameAr: 'تمارين أرضية' };
const jumping = { id: 'jump', key: 'show_jumping', nameEn: 'Show jumping', nameAr: 'قفز الحواجز' };

const level = (id: string, n: number) => ({
	id,
	nameEn: `Level ${n}`,
	nameAr: `المستوى ${n}`,
	inUse: false
});

export const disciplines: AcademyDisciplines = {
	enabled: [
		{ ...flatwork, inUse: true, levels: [level('f1', 1), level('f2', 2), level('f3', 3)] },
		{ ...jumping, inUse: false, levels: [level('j1', 1), level('j2', 2)] }
	],
	available: []
};

const plan = (id: string, name: string, levelIds: string[]): Plan => ({
	id,
	nameEn: name,
	nameAr: name,
	lessonsPerMonth: 8,
	monthlyPrice: 2200,
	discipline: flatwork,
	levels: levelIds.map((l, i) => ({ id: l, nameEn: l, nameAr: l, position: i + 1 })),
	isActive: true
});

export const beginner = plan('p-beginner', 'Beginner, 8 a month', ['f1']);
export const improver = plan('p-improver', 'Improver, 8 a month', ['f2', 'f3']);
export const anyLevel = plan('p-any', 'Any level, 8 a month', []);
export const plans = [beginner, improver, anyLevel];

const step = (discipline: typeof flatwork, id: string, n: number) => ({
	discipline,
	level: { id, nameEn: `Level ${n}`, nameAr: `المستوى ${n}`, position: n }
});

export const layla: Member = {
	id: 'm-layla',
	displayName: 'Layla',
	email: 'layla@example.com',
	roles: ['rider'],
	status: 'active',
	phone: null,
	age: 12,
	weightKg: null,
	...step(flatwork, 'f1', 1),
	plan: { ...beginner, levels: undefined },
	horseSource: 'school',
	privateHorse: null,
	upcomingBookings: 0,
	comingMove: null,
	comingPlan: null,
	levelHistory: [
		{
			from: null,
			to: step(flatwork, 'f1', 1),
			plan: null,
			startsOn: '2026-10-01',
			madeBy: 'Mona',
			madeAt: '2026-10-01T09:00:00Z'
		}
	]
};

export const levelStep = step;
export { flatwork, jumping };
