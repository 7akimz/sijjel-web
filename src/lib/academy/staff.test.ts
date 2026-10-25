import { describe, expect, it } from 'vitest';
import type { Membership } from '#lib/api/types.js';
import { isAcademyStaff } from './staff';

const membership = (overrides: Partial<Membership>): Membership => ({
	roles: ['trainer'],
	status: 'active',
	discipline: null,
	level: null,
	setupDone: true,
	...overrides
});

describe('isAcademyStaff', () => {
	it('accepts active trainers and admins', () => {
		expect(isAcademyStaff(membership({}))).toBe(true);
		expect(isAcademyStaff(membership({ roles: ['admin'] }))).toBe(true);
	});

	it('rejects riders, suspended staff and visitors without a membership', () => {
		expect(isAcademyStaff(membership({ roles: ['rider'] }))).toBe(false);
		expect(isAcademyStaff(membership({ roles: ['admin'], status: 'suspended' }))).toBe(false);
		expect(isAcademyStaff(null)).toBe(false);
	});
});
