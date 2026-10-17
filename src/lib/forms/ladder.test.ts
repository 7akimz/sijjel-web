import { describe, expect, it } from 'vitest';
import { addRow, ladderErrors, moveRow, removeRow, type LadderRow } from './ladder';

const rows = (...names: string[]): LadderRow[] =>
	names.map((name) => ({ nameEn: name, nameAr: `مستوى ${name}` }));

describe('ladder rows', () => {
	it('moves a row without changing the original list', () => {
		const ladder = rows('Intro', 'Novice', 'Medium');

		const moved = moveRow(ladder, 2, 0);

		expect(moved.map((r) => r.nameEn)).toEqual(['Medium', 'Intro', 'Novice']);
		expect(ladder.map((r) => r.nameEn)).toEqual(['Intro', 'Novice', 'Medium']);
	});

	it('ignores moves past either end', () => {
		const ladder = rows('Intro', 'Novice');

		expect(moveRow(ladder, 0, -1)).toEqual(ladder);
		expect(moveRow(ladder, 1, 2)).toEqual(ladder);
	});

	it('adds an empty row as the highest level and removes by index', () => {
		const ladder = addRow(rows('Intro'));

		expect(ladder).toEqual([...rows('Intro'), { nameEn: '', nameAr: '' }]);
		expect(removeRow(ladder, 0)).toEqual([{ nameEn: '', nameAr: '' }]);
	});
});

describe('ladderErrors', () => {
	it('accepts a valid ladder', () => {
		expect(ladderErrors(rows('Intro', 'Novice'))).toEqual([]);
	});

	it('rejects an empty ladder and more than 12 levels', () => {
		expect(ladderErrors([])).toEqual(['levels_count_invalid']);
		const thirteen = rows(...Array.from({ length: 13 }, (_, i) => `L${i + 1}`));
		expect(ladderErrors(thirteen)).toEqual(['levels_count_invalid']);
	});

	it('rejects a duplicate English name regardless of case and spacing', () => {
		expect(ladderErrors(rows('Intro', ' intro '))).toEqual(['level_duplicate']);
	});

	it('requires both names and limits them to 40 characters', () => {
		expect(ladderErrors([{ nameEn: 'Intro', nameAr: ' ' }])).toEqual(['level_name_required']);
		expect(ladderErrors([{ nameEn: 'x'.repeat(41), nameAr: 'س' }])).toEqual([
			'level_name_too_long'
		]);
	});
});
