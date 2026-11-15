import { describe, expect, it } from 'vitest';
import type { Membership } from '#lib/api/types.js';
import { ridersBookHere } from './rider';

const membership = (overrides: Partial<Membership>): Membership => ({
	roles: ['rider'],
	status: 'active',
	discipline: null,
	level: null,
	setupDone: true,
	bookingPaused: false,
	ridersBook: true,
	...overrides
});

describe('ridersBookHere', () => {
	it('lets an active rider book where riders book their own', () => {
		expect(ridersBookHere(membership({}))).toBe(true);
	});

	it('is off where staff book, for staff, and for visitors', () => {
		expect(ridersBookHere(membership({ ridersBook: false }))).toBe(false);
		expect(ridersBookHere(membership({ roles: ['trainer'] }))).toBe(false);
		expect(ridersBookHere(null)).toBe(false);
	});
});
