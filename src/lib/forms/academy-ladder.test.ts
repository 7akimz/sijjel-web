import { describe, expect, it } from 'vitest';
import { ApiError } from '#lib/api/errors.js';
import { ladderSaveError, toLadderInput } from './academy-ladder';

describe('toLadderInput', () => {
	it('keeps ids for existing levels and trims names', () => {
		const input = toLadderInput([
			{ id: 'l1', nameEn: ' Intro ', nameAr: 'تمهيدي', inUse: true },
			{ nameEn: 'New', nameAr: 'جديد' }
		]);

		expect(input).toEqual({
			levels: [
				{ id: 'l1', nameEn: 'Intro', nameAr: 'تمهيدي' },
				{ nameEn: 'New', nameAr: 'جديد' }
			]
		});
	});
});

describe('ladderSaveError', () => {
	it('names the horses whose range a reorder would invert', () => {
		const error = new ApiError(409, 'level_range_inverted', {
			levels: ['level_range_inverted'],
			horses: ['Zahra', 'Najm']
		});

		expect(ladderSaveError(error, 'en')).toContain('Zahra and Najm');
	});

	it('falls back to the error text', () => {
		expect(ladderSaveError(new ApiError(409, 'level_in_use'), 'en')).toBe(
			"A horse, rider or plan uses this level, so it can't be removed."
		);
	});
});
