import { describe, expect, it } from 'vitest';
import type { OwnerStatus } from '#lib/api/types.js';
import type { Package } from '#lib/api/subscription-types.js';
import { academyTab, addedText, packageOptionText } from './academy-page';

const noOwner: OwnerStatus = {
	state: 'none',
	name: null,
	inviteId: null,
	sentAt: null,
	expiresAt: null,
	joinedAt: null
};
const pending = { owner: { ...noOwner, state: 'pending' as const, name: 'Karim' } };

describe('academyTab', () => {
	it('reads the tab, defaulting to Overview', () => {
		expect(academyTab(null)).toBe('overview');
		expect(academyTab('subscription')).toBe('subscription');
		expect(academyTab('settings')).toBe('settings');
		expect(academyTab('nonsense')).toBe('overview');
	});
});

describe('addedText', () => {
	it('names the owner when the trial waits for them', () => {
		expect(addedText('Orlando', pending, 'trial_waiting', 'en')).toBe(
			'Orlando is added. The trial starts when Karim finishes setting it up.'
		);
	});

	it('says only that it is added otherwise', () => {
		expect(addedText('Orlando', { owner: noOwner }, 'no_package', 'en')).toBe('Orlando is added.');
		expect(addedText('Orlando', pending, 'free', 'en')).toBe('Orlando is added.');
		expect(addedText('Orlando', { owner: noOwner }, 'trial_waiting', 'en')).toBe(
			'Orlando is added.'
		);
	});
});

describe('packageOptionText', () => {
	const starter: Package = {
		id: 'starter',
		nameEn: 'Starter',
		nameAr: 'مبتدئ',
		maxRiders: 25,
		monthlyPrice: 1500,
		isActive: true,
		country: 'EG',
		currency: 'EGP'
	};

	it('gives the rider limit and price beside the name', () => {
		expect(packageOptionText(starter, 'en')).toMatch(
			/^Starter · Up to 25 riders · EGP\s1,500 a month$/
		);
	});

	it('says unlimited when there is no limit', () => {
		expect(packageOptionText({ ...starter, nameEn: 'Unlimited', maxRiders: null }, 'en')).toMatch(
			/^Unlimited · Unlimited riders · EGP\s1,500 a month$/
		);
	});
});
