import { describe, expect, it } from 'vitest';
import { academyLoginLocation, platformSignOutLocation } from './sign-out.js';

describe('platformSignOutLocation', () => {
	it('points from an academy host at sign-out on the platform host, naming the academy', () => {
		expect(platformSignOutLocation('alfaris.localhost:3001', 'alfaris')).toBe(
			'//localhost:3001/sign-out?academy=alfaris'
		);
		expect(platformSignOutLocation('alfaris.sijjel.com', 'alfaris')).toBe(
			'//sijjel.com/sign-out?academy=alfaris'
		);
	});

	it('gives nothing when the host is not that academy', () => {
		expect(platformSignOutLocation('localhost:3001', 'alfaris')).toBeNull();
		expect(platformSignOutLocation('orlando.localhost:3001', 'alfaris')).toBeNull();
	});
});

describe('academyLoginLocation', () => {
	it("sends the browser back to the academy's sign-in page", () => {
		expect(academyLoginLocation('localhost:3001', 'alfaris')).toBe(
			'//alfaris.localhost:3001/login'
		);
	});

	it('falls back to the platform sign-in for anything that is not a slug', () => {
		expect(academyLoginLocation('localhost:3001', null)).toBe('/login');
		expect(academyLoginLocation('localhost:3001', 'evil.com/x')).toBe('/login');
		expect(academyLoginLocation('localhost:3001', '')).toBe('/login');
	});
});
