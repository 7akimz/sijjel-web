import type { FieldErrors } from '#lib/api/errors.js';

export type PlanForm = {
	nameEn: string;
	nameAr: string;
	lessonsPerMonth: number;
	monthlyPrice: number;
};

export function planErrors(p: PlanForm): FieldErrors {
	const errors: FieldErrors = {};
	for (const field of ['nameEn', 'nameAr'] as const) {
		const name = p[field].trim();
		if (!name) errors[field] = ['name_required'];
		else if ([...name].length > 60) errors[field] = ['name_too_long'];
	}
	if (!Number.isInteger(p.lessonsPerMonth) || p.lessonsPerMonth < 1 || p.lessonsPerMonth > 62) {
		errors.lessonsPerMonth = ['lessons_per_month_invalid'];
	}
	if (!Number.isInteger(p.monthlyPrice) || p.monthlyPrice < 0 || p.monthlyPrice > 1_000_000) {
		errors.monthlyPrice = ['price_invalid'];
	}
	return errors;
}
