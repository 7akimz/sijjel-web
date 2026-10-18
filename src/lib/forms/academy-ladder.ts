import { ApiError, errorText } from '#lib/api/errors.js';
import type { Locale } from '#lib/api/types.js';
import { m } from '#lib/paraglide/messages.js';
import type { LadderRow } from './ladder';

export function toLadderInput(rows: LadderRow[]) {
	return {
		levels: rows.map((row) => ({
			...(row.id ? { id: row.id } : {}),
			nameEn: row.nameEn.trim(),
			nameAr: row.nameAr.trim()
		}))
	};
}

export function ladderSaveError(error: ApiError, locale: Locale): string {
	const horses = error.fields.horses;
	if (error.code === 'level_range_inverted' && horses?.length) {
		const list = new Intl.ListFormat(locale, { type: 'conjunction' }).format(horses);
		return m.ladder_inverts_horses({ horses: list }, { locale });
	}
	return errorText(error.code, locale);
}
