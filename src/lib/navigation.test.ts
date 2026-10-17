import { describe, expect, it } from 'vitest';
import { safeReturnTo } from './navigation';

describe('safeReturnTo', () => {
	it('keeps same-site paths', () => {
		expect(safeReturnTo('/invite/abc?x=1')).toBe('/invite/abc?x=1');
	});

	it('sends other targets home', () => {
		for (const value of [null, '', 'https://evil.test', '//evil.test', '/\\evil.test', 'invite']) {
			expect(safeReturnTo(value)).toBe('/');
		}
	});
});
