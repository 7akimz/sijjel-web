import { describe, expect, it } from 'vitest';
import {
	academyContinueLocation,
	academyHomeLocation,
	platformSignInLocation,
	platformSignOutLocation
} from './cross-host.js';

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

describe('academyHomeLocation', () => {
	it("sends the browser back to the academy's home", () => {
		expect(academyHomeLocation('localhost:3001', 'alfaris')).toBe('//alfaris.localhost:3001/');
	});

	it('falls back to the platform home for anything that is not a slug', () => {
		expect(academyHomeLocation('localhost:3001', null)).toBe('/');
		expect(academyHomeLocation('localhost:3001', 'evil.com/x')).toBe('/');
		expect(academyHomeLocation('localhost:3001', '')).toBe('/');
	});
});

describe('platformSignInLocation', () => {
	it('points from an academy host at the sign-in link on the platform host', () => {
		expect(platformSignInLocation('alfaris.localhost:3001', 'alfaris', 'a+b', '/board?day=2')).toBe(
			'//localhost:3001/sign-in-link?token=a%2Bb&academy=alfaris&returnTo=%2Fboard%3Fday%3D2'
		);
	});

	it('gives nothing when the host is not that academy', () => {
		expect(platformSignInLocation('localhost:3001', 'alfaris', 't', '/')).toBeNull();
	});
});

describe('academyContinueLocation', () => {
	it('sends the browser back to the academy, keeping where it was going', () => {
		expect(academyContinueLocation('localhost:3001', 'alfaris', '/board?day=2')).toBe(
			'//alfaris.localhost:3001/continue?returnTo=%2Fboard%3Fday%3D2'
		);
	});

	it('keeps only same-site paths and falls back to the platform home for a bad slug', () => {
		expect(academyContinueLocation('localhost:3001', 'alfaris', '//evil.test')).toBe(
			'//alfaris.localhost:3001/continue?returnTo=%2F'
		);
		expect(academyContinueLocation('localhost:3001', 'evil.com/x', '/')).toBe('/');
		expect(academyContinueLocation('localhost:3001', null, '/')).toBe('/');
	});
});
