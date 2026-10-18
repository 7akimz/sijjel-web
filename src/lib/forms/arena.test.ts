import { describe, expect, it } from 'vitest';
import { arenaErrors } from './arena';

describe('arenaErrors', () => {
	it('accepts a named arena with room for riders', () => {
		expect(arenaErrors({ name: 'Main arena', capacity: 5 })).toEqual({});
	});

	it('mirrors the API rules', () => {
		expect(arenaErrors({ name: '  ', capacity: 5 })).toEqual({ name: ['name_required'] });
		expect(arenaErrors({ name: 'x'.repeat(61), capacity: 5 })).toEqual({ name: ['name_too_long'] });
		expect(arenaErrors({ name: 'Main', capacity: 0 })).toEqual({ capacity: ['capacity_invalid'] });
		expect(arenaErrors({ name: 'Main', capacity: 51 })).toEqual({ capacity: ['capacity_invalid'] });
	});
});
