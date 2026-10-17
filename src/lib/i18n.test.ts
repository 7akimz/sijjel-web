import { describe, expect, it } from 'vitest';
import { baseLocale, locales } from '#lib/paraglide/runtime.js';

describe('locales', () => {
	it('offers English and Arabic, defaulting to English', () => {
		expect([...locales].sort()).toEqual(['ar', 'en']);
		expect(baseLocale).toBe('en');
	});
});
