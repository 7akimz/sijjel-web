import { describe, expect, it } from 'vitest';
import { planErrors } from './plan';

const plan = {
	nameEn: 'Jumping, 3 a week',
	nameAr: 'قفز، 3 في الأسبوع',
	sessionsPerWeek: 3,
	monthlyPrice: 1200
};

describe('planErrors', () => {
	it('accepts a complete plan', () => {
		expect(planErrors(plan)).toEqual({});
	});

	it('mirrors the API rules', () => {
		expect(planErrors({ ...plan, sessionsPerWeek: 0 })).toEqual({
			sessionsPerWeek: ['sessions_per_week_invalid']
		});
		expect(planErrors({ ...plan, monthlyPrice: -1 })).toEqual({ monthlyPrice: ['price_invalid'] });
		expect(planErrors({ ...plan, nameAr: ' ' })).toEqual({ nameAr: ['name_required'] });
	});
});
