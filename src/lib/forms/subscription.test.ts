import { describe, expect, it } from 'vitest';
import type { AcademySummary } from '#lib/api/types.js';
import { matchesFilter, monthsText, ridersText, sortByUrgency, statusTone } from './subscription';

const academy = (nameEn: string, extra: Partial<AcademySummary>): AcademySummary => ({
	id: nameEn,
	slug: nameEn.toLowerCase(),
	nameEn,
	nameAr: nameEn,
	isActive: true,
	disciplines: [],
	ownerCount: 1,
	package: null,
	riders: { count: 0, limit: null },
	status: 'no_package',
	paidUntil: null,
	monthsUnpaid: 0,
	blocked: false,
	...extra
});

describe('sortByUrgency', () => {
	it('puts the most months owed first, then due soon, then by paid until', () => {
		const list = [
			academy('Paid', { status: 'paid', paidUntil: '2026-12-01' }),
			academy('One', { status: 'unpaid', paidUntil: '2026-11-01', monthsUnpaid: 1 }),
			academy('Soon', { status: 'due_soon', paidUntil: '2026-11-17' }),
			academy('Three', { status: 'unpaid', paidUntil: '2026-09-01', monthsUnpaid: 3 }),
			academy('None', {})
		];
		expect(sortByUrgency(list).map((a) => a.nameEn)).toEqual([
			'Three',
			'One',
			'Soon',
			'Paid',
			'None'
		]);
	});
});

describe('matchesFilter', () => {
	it('matches blocked academies by the switch and unpaid ones by status', () => {
		const blockedPaid = academy('A', { status: 'paid', blocked: true });
		const blockedUnpaid = academy('B', { status: 'unpaid', blocked: true });
		const unpaid = academy('C', { status: 'unpaid' });
		expect([blockedPaid, blockedUnpaid, unpaid].filter((a) => matchesFilter(a, 'blocked'))).toEqual(
			[blockedPaid, blockedUnpaid]
		);
		expect([blockedPaid, blockedUnpaid, unpaid].filter((a) => matchesFilter(a, 'unpaid'))).toEqual([
			blockedUnpaid,
			unpaid
		]);
		expect(matchesFilter(unpaid, 'all')).toBe(true);
	});
});

describe('ridersText', () => {
	it('shows the limit only when there is one', () => {
		expect(ridersText({ count: 47, limit: 50 }, 'en')).toBe('Riders: 47 of 50');
		expect(ridersText({ count: 47, limit: null }, 'en')).toBe('Riders: 47');
	});
});

describe('monthsText', () => {
	it('says month or months', () => {
		expect(monthsText(1, 'en')).toBe('1 month');
		expect(monthsText(2, 'en')).toBe('2 months');
		expect(monthsText(1, 'ar')).toBe('شهر واحد');
		expect(monthsText(2, 'ar')).toBe('شهران');
		expect(monthsText(3, 'ar')).toBe('3 أشهر');
		expect(monthsText(11, 'ar')).toBe('11 شهرًا');
	});
});

describe('statusTone', () => {
	it('shows blocked as danger whatever the status', () => {
		expect(statusTone('paid', true)).toBe('danger');
		expect(statusTone('unpaid', false)).toBe('danger');
		expect(statusTone('due_soon', false)).toBe('pending');
		expect(statusTone('paid', false)).toBe('active');
		expect(statusTone('free', false)).toBe('neutral');
		expect(statusTone('no_package', false)).toBe('stone');
	});
});
