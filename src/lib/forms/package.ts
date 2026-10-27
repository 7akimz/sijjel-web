import type { FieldErrors } from '#lib/api/errors.js';
import type { PackageInput } from '#lib/api/subscription-types.js';

export function packageErrors(p: PackageInput): FieldErrors {
	const errors: FieldErrors = {};
	for (const field of ['nameEn', 'nameAr'] as const) {
		const name = p[field].trim();
		if (!name) errors[field] = ['name_required'];
		else if ([...name].length > 80) errors[field] = ['name_too_long'];
	}
	if (
		p.maxRiders !== null &&
		(!Number.isInteger(p.maxRiders) || p.maxRiders < 1 || p.maxRiders > 100_000)
	) {
		errors.maxRiders = ['max_riders_invalid'];
	}
	if (!Number.isInteger(p.monthlyPrice) || p.monthlyPrice < 0 || p.monthlyPrice > 10_000_000) {
		errors.monthlyPrice = ['price_invalid'];
	}
	return errors;
}
