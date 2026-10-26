import { describe, expect, it } from 'vitest';
import { nextLevel } from './move';

const level = (id: string) => ({ id, nameEn: id, nameAr: id, inUse: false });
const ladder = [level('intro'), level('prelim'), level('novice')];

describe('nextLevel', () => {
	it('gives the following level in ladder order', () => {
		expect(nextLevel(ladder, 'intro')?.id).toBe('prelim');
		expect(nextLevel(ladder, 'prelim')?.id).toBe('novice');
	});

	it('gives null at the top of the ladder', () => {
		expect(nextLevel(ladder, 'novice')).toBeNull();
	});

	it('gives null for a level not on the ladder', () => {
		expect(nextLevel(ladder, 'gone')).toBeNull();
	});
});
