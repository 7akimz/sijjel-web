import { describe, expect, it } from 'vitest';
import { signInLinkLocation } from './sign-in-link.js';

describe('signInLinkLocation', () => {
	it('points at the academy host and keeps the scheme the browser is on', () => {
		expect(signInLinkLocation('alfaris', 'localhost:3001', 'a+b/c')).toBe(
			'//alfaris.localhost:3001/sign-in-link?token=a%2Bb%2Fc'
		);
	});
});
