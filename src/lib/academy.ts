import type { AcademyTenant, Locale } from '#lib/api/types.js';

export function academyName(academy: Pick<AcademyTenant, 'nameEn' | 'nameAr'>, locale: Locale) {
	return locale === 'ar' ? academy.nameAr : academy.nameEn;
}

export function academyMark(name: string): string {
	const words = name.trim().split(/\s+/).filter(Boolean);
	return words
		.slice(0, 2)
		.map((word) => Array.from(word)[0])
		.join('')
		.toLocaleUpperCase();
}
