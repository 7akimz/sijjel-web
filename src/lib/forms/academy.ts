import type { Discipline, Locale } from '#lib/api/types.js';
import type { FieldErrors } from '#lib/api/errors.js';

export interface AcademyForm {
	slug: string;
	nameEn: string;
	nameAr: string;
	timeZone: string;
	defaultLanguage: Locale;
	disciplineIds: string[];
}

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

export function toCreateAcademyRequest(form: AcademyForm): AcademyForm {
	return {
		...form,
		slug: form.slug.trim().toLowerCase(),
		nameEn: form.nameEn.trim(),
		nameAr: form.nameAr.trim(),
		timeZone: form.timeZone.trim()
	};
}

export function academyFormErrors(form: AcademyForm): FieldErrors {
	const request = toCreateAcademyRequest(form);
	const errors: FieldErrors = {};
	if (!SLUG_PATTERN.test(request.slug)) errors.slug = ['slug_invalid'];
	if (!request.nameEn) errors.nameEn = ['name_required'];
	if (!request.nameAr) errors.nameAr = ['name_required'];
	if (request.disciplineIds.length === 0) errors.disciplineIds = ['disciplines_required'];
	return errors;
}

// Show jumping is the most common discipline in Egypt, and beginners start on flatwork before
// they choose one, so a new academy starts with both ticked.
const DEFAULT_DISCIPLINE_KEYS = ['show_jumping', 'flatwork'];

export function initialDisciplinePicks(disciplines: Discipline[]): Record<string, boolean> {
	return Object.fromEntries(
		disciplines.map((d) => [d.id, DEFAULT_DISCIPLINE_KEYS.includes(d.key)])
	);
}
