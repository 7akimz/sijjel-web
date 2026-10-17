import { describe, expect, it } from 'vitest';
import { safeReturnTo } from './navigation';

describe('safeReturnTo', () => {
	it('keeps same-site paths with their query and fragment', () => {
		expect(safeReturnTo('/invite/abc?x=1#top')).toBe('/invite/abc?x=1#top');
	});

	it('sends other targets home', () => {
		for (const value of [
			null,
			'',
			'https://evil.test',
			'//evil.test',
			'/\\evil.test',
			'/\t/evil.test',
			'/\n/evil.test',
			'invite'
		]) {
			expect(safeReturnTo(value)).toBe('/');
		}
	});
});
