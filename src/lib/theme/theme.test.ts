import { describe, expect, it } from 'vitest';
import { nextTheme, themeAttr, themeFromCookie } from './theme';

describe('theme', () => {
	it('reads the cookie, defaulting to the device setting', () => {
		expect(themeFromCookie('dark')).toBe('dark');
		expect(themeFromCookie('light')).toBe('light');
		expect(themeFromCookie('purple')).toBe('system');
		expect(themeFromCookie(undefined)).toBe('system');
	});

	it('only writes data-theme for an explicit choice', () => {
		expect(themeAttr('dark')).toBe('data-theme="dark"');
		expect(themeAttr('system')).toBe('');
	});

	it('cycles system, light, dark', () => {
		expect([nextTheme('system'), nextTheme('light'), nextTheme('dark')]).toEqual([
			'light',
			'dark',
			'system'
		]);
	});
});
