import { describe, expect, it } from 'vitest';
import type { AcademyDisciplines, Horse } from '#lib/api/academy-types.js';
import {
	horseErrors,
	newHorseState,
	rangeAfterDisciplineChange,
	rangeLabel,
	toHorseInput
} from './horse';

const ladder = (prefix: string, names: string[]) =>
	names.map((nameEn, i) => ({ id: `${prefix}${i + 1}`, nameEn, nameAr: nameEn, inUse: false }));

const disciplines: AcademyDisciplines = {
	enabled: [
		{
			id: 'dressage',
			key: 'dressage',
			nameEn: 'Dressage',
			nameAr: 'الترويض',
			inUse: false,
			levels: ladder('d', ['Intro', 'Preliminary', 'Novice', 'Elementary', 'Medium+'])
		},
		{
			id: 'jumping',
			key: 'show_jumping',
			nameEn: 'Show jumping',
			nameAr: 'قفز الحواجز',
			inUse: false,
			levels: ladder('j', ['Poles', '60 cm', '80 cm', '1 m', '1.10 m+'])
		}
	],
	available: []
};

describe('horse form', () => {
	it('starts on the first discipline across its whole ladder', () => {
		expect(newHorseState(disciplines)).toEqual({
			name: '',
			disciplineId: 'dressage',
			minLevelId: 'd1',
			maxLevelId: 'd5',
			maxSessionsPerDay: 3,
			maxRiderWeightKg: '',
			notes: '',
			isActive: true
		});
	});

	it('resets the range to the new ladder when the discipline changes', () => {
		expect(rangeAfterDisciplineChange(disciplines, 'jumping')).toEqual({
			minLevelId: 'j1',
			maxLevelId: 'j5'
		});
	});

	it('mirrors the API rules', () => {
		const valid = {
			...newHorseState(disciplines),
			name: 'Zahra',
			minLevelId: 'd1',
			maxLevelId: 'd3'
		};

		expect(horseErrors(valid, disciplines)).toEqual({});
		expect(horseErrors({ ...valid, minLevelId: 'd3', maxLevelId: 'd1' }, disciplines)).toEqual({
			minLevelId: ['level_range_invalid']
		});
		expect(horseErrors({ ...valid, minLevelId: 'j1' }, disciplines)).toEqual({
			minLevelId: ['level_range_invalid']
		});
		expect(horseErrors({ ...valid, maxSessionsPerDay: 0 }, disciplines)).toEqual({
			maxSessionsPerDay: ['sessions_per_day_invalid']
		});
		expect(horseErrors({ ...valid, name: '  ' }, disciplines)).toEqual({ name: ['name_required'] });
		expect(horseErrors({ ...valid, notes: 'x'.repeat(501) }, disciplines)).toEqual({
			notes: ['notes_too_long']
		});
	});

	it('sends a trimmed name and no blank notes', () => {
		const input = toHorseInput({ ...newHorseState(disciplines), name: ' Zahra ', notes: '  ' });

		expect(input).toMatchObject({
			name: 'Zahra',
			notes: null,
			maxSessionsPerDay: 3,
			isActive: true
		});
	});

	it('labels the level range', () => {
		const level = (nameEn: string) => ({ id: nameEn, nameEn, nameAr: nameEn, position: 1 });
		const horse = { minLevel: level('Intro'), maxLevel: level('Novice') } as Horse;

		expect(rangeLabel(horse, 'en')).toBe('Intro – Novice');
		expect(rangeLabel({ ...horse, maxLevel: level('Intro') }, 'en')).toBe('Intro');
	});

	it('treats the weight limit as optional, from 20 to 200 kg', () => {
		const valid = { ...newHorseState(disciplines), name: 'Zahra' };

		expect(toHorseInput(valid).maxRiderWeightKg).toBeNull();
		expect(toHorseInput({ ...valid, maxRiderWeightKg: '80' }).maxRiderWeightKg).toBe(80);
		expect(horseErrors({ ...valid, maxRiderWeightKg: '15' }, disciplines)).toEqual({
			maxRiderWeightKg: ['weight_range_invalid']
		});
	});
});
