import type { AcademyDisciplines, Horse, HorseInput } from '#lib/api/academy-types.js';
import type { FieldErrors } from '#lib/api/errors.js';
import type { Locale } from '#lib/api/types.js';
import { localName } from '#lib/academy.js';

export type HorseFormState = {
	name: string;
	disciplineId: string;
	minLevelId: string;
	maxLevelId: string;
	maxSessionsPerDay: number;
	notes: string;
	isActive: boolean;
};

export const DEFAULT_SESSIONS_PER_DAY = 3;

const ladderOf = (d: AcademyDisciplines, disciplineId: string) =>
	d.enabled.find((discipline) => discipline.id === disciplineId)?.levels ?? [];

export function rangeAfterDisciplineChange(d: AcademyDisciplines, disciplineId: string) {
	const levels = ladderOf(d, disciplineId);
	return { minLevelId: levels[0]?.id ?? '', maxLevelId: levels[levels.length - 1]?.id ?? '' };
}

export function newHorseState(d: AcademyDisciplines): HorseFormState {
	const disciplineId = d.enabled[0]?.id ?? '';
	return {
		name: '',
		disciplineId,
		...rangeAfterDisciplineChange(d, disciplineId),
		maxSessionsPerDay: DEFAULT_SESSIONS_PER_DAY,
		notes: '',
		isActive: true
	};
}

export function stateFromHorse(h: Horse): HorseFormState {
	return {
		name: h.name,
		disciplineId: h.discipline.id,
		minLevelId: h.minLevel.id,
		maxLevelId: h.maxLevel.id,
		maxSessionsPerDay: h.maxSessionsPerDay,
		notes: h.notes ?? '',
		isActive: h.isActive
	};
}

export function horseErrors(s: HorseFormState, d: AcademyDisciplines): FieldErrors {
	const errors: FieldErrors = {};
	const name = s.name.trim();
	if (!name) errors.name = ['name_required'];
	else if ([...name].length > 60) errors.name = ['name_too_long'];
	const levels = ladderOf(d, s.disciplineId);
	const min = levels.findIndex((l) => l.id === s.minLevelId);
	const max = levels.findIndex((l) => l.id === s.maxLevelId);
	if (min < 0 || min > max) errors.minLevelId = ['level_range_invalid'];
	else if (max < 0) errors.maxLevelId = ['level_range_invalid'];
	const sessions = s.maxSessionsPerDay;
	if (!Number.isInteger(sessions) || sessions < 1 || sessions > 6) {
		errors.maxSessionsPerDay = ['sessions_per_day_invalid'];
	}
	if ([...s.notes.trim()].length > 500) errors.notes = ['notes_too_long'];
	return errors;
}

export function toHorseInput(s: HorseFormState): HorseInput {
	const notes = s.notes.trim();
	return {
		name: s.name.trim(),
		disciplineId: s.disciplineId,
		minLevelId: s.minLevelId,
		maxLevelId: s.maxLevelId,
		maxSessionsPerDay: s.maxSessionsPerDay,
		notes: notes || null,
		isActive: s.isActive
	};
}

export function rangeLabel(h: Pick<Horse, 'minLevel' | 'maxLevel'>, locale: Locale): string {
	const min = localName(h.minLevel, locale);
	return h.minLevel.id === h.maxLevel.id ? min : `${min} – ${localName(h.maxLevel, locale)}`;
}
