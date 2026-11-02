import { describe, expect, it } from 'vitest';
import type { Plan } from '#lib/api/member-types.js';
import { disciplineHasPlan, planFits, plansFor } from './plans-fit';

const dressage = { id: 'dressage', key: 'dressage', nameEn: 'Dressage', nameAr: 'ترويض' };
const jumping = { id: 'jumping', key: 'show_jumping', nameEn: 'Show jumping', nameAr: 'قفز' };
const level = (id: string, position: number) => ({ id, nameEn: id, nameAr: id, position });

const plan = (id: string, overrides: Partial<Plan> = {}): Plan => ({
	id,
	nameEn: id,
	nameAr: id,
	lessonsPerMonth: 8,
	monthlyPrice: 2200,
	discipline: null,
	isActive: true,
	...overrides
});

const anyone = plan('anyone');
const allDressage = plan('all-dressage', { discipline: dressage, levels: [] });
const introOnly = plan('intro-only', { discipline: dressage, levels: [level('intro', 1)] });
const prelimOnly = plan('prelim-only', { discipline: dressage, levels: [level('prelim', 2)] });
const jumpingPlan = plan('jumping', { discipline: jumping });

describe('planFits', () => {
	it("fits plans with no discipline, the rider's discipline and no levels, or including the level", () => {
		expect(planFits(anyone, 'dressage', 'intro')).toBe(true);
		expect(planFits(allDressage, 'dressage', 'intro')).toBe(true);
		expect(planFits(plan('no-levels-key', { discipline: dressage }), 'dressage', 'intro')).toBe(
			true
		);
		expect(planFits(introOnly, 'dressage', 'intro')).toBe(true);
	});

	it("refuses another discipline or levels without the rider's", () => {
		expect(planFits(jumpingPlan, 'dressage', 'intro')).toBe(false);
		expect(planFits(prelimOnly, 'dressage', 'intro')).toBe(false);
	});
});

describe('plansFor', () => {
	const all = [anyone, allDressage, introOnly, prelimOnly, jumpingPlan];

	it('offers the active plans that fit', () => {
		expect(plansFor(all, 'dressage', 'intro').map((p) => p.id)).toEqual([
			'anyone',
			'all-dressage',
			'intro-only'
		]);
	});

	it('leaves out retired plans', () => {
		expect(plansFor([{ ...anyone, isActive: false }, introOnly], 'dressage', 'intro')).toEqual([
			introOnly
		]);
	});

	it('keeps the current plan as an option even when it no longer fits', () => {
		const retired = { ...prelimOnly, isActive: false };
		expect(
			plansFor([anyone, retired], 'dressage', 'intro', 'prelim-only').map((p) => p.id)
		).toEqual(['anyone', 'prelim-only']);
	});
});

describe('disciplineHasPlan', () => {
	it('is true when an active plan is for the discipline at any level, or for any discipline', () => {
		expect(disciplineHasPlan([prelimOnly], 'dressage')).toBe(true);
		expect(disciplineHasPlan([anyone], 'dressage')).toBe(true);
	});

	it('ignores inactive plans and plans for other disciplines', () => {
		expect(disciplineHasPlan([jumpingPlan], 'dressage')).toBe(false);
		expect(disciplineHasPlan([{ ...allDressage, isActive: false }], 'dressage')).toBe(false);
		expect(disciplineHasPlan([], 'dressage')).toBe(false);
	});
});
