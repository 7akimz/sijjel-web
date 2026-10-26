import { describe, expect, it } from 'vitest';
import { planErrors } from './plan';

const plan = {
	nameEn: 'Jumping, 8 a month',
	nameAr: 'قفز، 8 في الشهر',
	lessonsPerMonth: 8,
	monthlyPrice: 1200
};

describe('planErrors', () => {
	it('accepts a complete plan', () => {
		expect(planErrors(plan)).toEqual({});
	});

	it('mirrors the API rules', () => {
		expect(planErrors({ ...plan, lessonsPerMonth: 0 })).toEqual({
			lessonsPerMonth: ['lessons_per_month_invalid']
		});
		expect(planErrors({ ...plan, lessonsPerMonth: 63 })).toEqual({
			lessonsPerMonth: ['lessons_per_month_invalid']
		});
		expect(planErrors({ ...plan, lessonsPerMonth: 62 })).toEqual({});
		expect(planErrors({ ...plan, monthlyPrice: -1 })).toEqual({ monthlyPrice: ['price_invalid'] });
		expect(planErrors({ ...plan, nameAr: ' ' })).toEqual({ nameAr: ['name_required'] });
	});
});
