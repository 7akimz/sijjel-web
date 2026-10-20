import { describe, expect, it } from 'vitest';
import {
	academyFormErrors,
	toCreateAcademyRequest,
	type AcademyForm,
	initialDisciplinePicks
} from './academy';

const form = (overrides: Partial<AcademyForm> = {}): AcademyForm => ({
	slug: 'alfaris',
	nameEn: 'Al Faris',
	nameAr: 'الفارس',
	timeZone: 'Asia/Riyadh',
	defaultLanguage: 'ar',
	disciplineIds: ['d1'],
	...overrides
});

describe('toCreateAcademyRequest', () => {
	it('trims and lowercases the slug and trims the names', () => {
		const request = toCreateAcademyRequest(
			form({ slug: ' AlFaris ', nameEn: ' Al Faris ', nameAr: ' الفارس ' })
		);

		expect(request).toEqual({
			slug: 'alfaris',
			nameEn: 'Al Faris',
			nameAr: 'الفارس',
			timeZone: 'Asia/Riyadh',
			defaultLanguage: 'ar',
			disciplineIds: ['d1']
		});
	});
});

describe('academyFormErrors', () => {
	it('accepts a complete form', () => {
		expect(academyFormErrors(form())).toEqual({});
	});

	it('requires at least one discipline', () => {
		expect(academyFormErrors(form({ disciplineIds: [] }))).toEqual({
			disciplineIds: ['disciplines_required']
		});
	});

	it('mirrors the API slug rule', () => {
		for (const slug of ['ab', '-alfaris', 'alfaris-', 'al_faris', 'a'.repeat(31)]) {
			expect(academyFormErrors(form({ slug })).slug).toEqual(['slug_invalid']);
		}
		expect(academyFormErrors(form({ slug: ' Al-Faris1 ' })).slug).toBeUndefined();
	});

	it('requires both names', () => {
		expect(academyFormErrors(form({ nameEn: ' ', nameAr: '' }))).toEqual({
			nameEn: ['name_required'],
			nameAr: ['name_required']
		});
	});
});

describe('initialDisciplinePicks', () => {
	it('ticks show jumping and flatwork, and nothing else', () => {
		const discipline = (id: string, key: string) => ({
			id,
			key,
			nameEn: key,
			nameAr: key,
			levels: []
		});

		expect(
			initialDisciplinePicks([
				discipline('d', 'dressage'),
				discipline('j', 'show_jumping'),
				discipline('f', 'flatwork')
			])
		).toEqual({
			d: false,
			j: true,
			f: true
		});
	});
});
