import type { AcademyTenant, Locale, Role } from '#lib/api/types.js';
import { m } from '#lib/paraglide/messages.js';

export function academyName(academy: Pick<AcademyTenant, 'nameEn' | 'nameAr'>, locale: Locale) {
	return localName(academy, locale);
}

// The mark uses the English name so an academy keeps the same mark in both languages.
export function academyMark(name: string): string {
	const words = name.trim().split(/\s+/).filter(Boolean);
	return words
		.slice(0, 2)
		.map((word) => Array.from(word)[0])
		.join('')
		.toLocaleUpperCase();
}

export function roleName(role: Role, locale?: Locale): string {
	const names = { admin: m.role_admin, trainer: m.role_trainer, rider: m.role_rider };
	return names[role]({}, { locale });
}

export function localName(item: { nameEn: string; nameAr: string }, locale: Locale): string {
	return locale === 'ar' ? item.nameAr : item.nameEn;
}
