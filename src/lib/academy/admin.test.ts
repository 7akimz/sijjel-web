import { describe, expect, it } from 'vitest';
import type { Membership } from '#lib/api/types.js';
import { isAcademyAdmin } from './admin';

const membership = (overrides: Partial<Membership>): Membership => ({
	roles: ['admin'],
	status: 'active',
	discipline: null,
	level: null,
	...overrides
});

describe('isAcademyAdmin', () => {
	it('accepts an active admin', () => {
		expect(isAcademyAdmin(membership({}))).toBe(true);
	});

	it('rejects riders, suspended admins and visitors without a membership', () => {
		expect(isAcademyAdmin(membership({ roles: ['rider'] }))).toBe(false);
		expect(isAcademyAdmin(membership({ status: 'suspended' }))).toBe(false);
		expect(isAcademyAdmin(null)).toBe(false);
	});
});
