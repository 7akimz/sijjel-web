import { describe, expect, it } from 'vitest';
import type { Me } from '#lib/api/types.js';
import { needsPhone } from './account';

const me = (phone: string | null): Me => ({
	id: 'u1',
	phone,
	email: 'layla@example.test',
	displayName: 'Layla',
	preferredLanguage: null,
	isPlatformAdmin: false
});

describe('needsPhone', () => {
	it('sends an account without a phone to add one', () => {
		expect(needsPhone(me(null), '/')).toBe(true);
		expect(needsPhone(me(null), '/members')).toBe(true);
	});

	it('leaves the account page, sign-in and the API alone', () => {
		expect(needsPhone(me(null), '/account')).toBe(false);
		expect(needsPhone(me(null), '/login')).toBe(false);
		expect(needsPhone(me(null), '/api/me')).toBe(false);
	});

	it('leaves accounts with a phone and signed-out visitors alone', () => {
		expect(needsPhone(me('201000000001'), '/')).toBe(false);
		expect(needsPhone(null, '/')).toBe(false);
	});
});
