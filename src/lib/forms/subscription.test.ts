import { describe, expect, it } from 'vitest';
import type { AcademySummary } from '#lib/api/types.js';
import type { SubscriptionEntry } from '#lib/api/subscription-types.js';
import {
	daysText,
	entryText,
	matchesFilter,
	monthsText,
	riderCountText,
	ridersText,
	sortByUrgency,
	statusTone
} from './subscription';

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

const free: SubscriptionEntry = {
	id: 'e1',
	kind: 'free',
	amount: null,
	method: null,
	days: 7,
	note: null,
	startsOn: '2026-11-15',
	endsOn: '2026-11-22',
	madeBy: 'admin@sijjel.test',
	madeAt: '2026-11-15T08:00:00Z'
};

describe('entryText', () => {
	it('points the date arrow the way each language reads', () => {
		expect(entryText(free, 'en')).toContain('15 Nov → 22 Nov');
		expect(entryText(free, 'ar')).toContain('←');
		expect(entryText(free, 'ar')).not.toContain('→');
	});

	it('can leave out who recorded the entry', () => {
		expect(entryText(free, 'en')).toContain('admin@sijjel.test');
		expect(entryText(free, 'en', { withMadeBy: false })).not.toContain('admin@sijjel.test');
	});
});

describe('Arabic counts', () => {
	it('agrees days and riders with the number', () => {
		expect(daysText(7, 'ar')).toBe('7 أيام');
		expect(daysText(30, 'ar')).toBe('30 يومًا');
		expect(daysText(1, 'en')).toBe('1 day');
		expect(daysText(7, 'en')).toBe('7 days');
		expect(riderCountText(5, 'ar')).toBe('5 فرسان');
		expect(riderCountText(25, 'ar')).toBe('25 فارسًا');
		expect(riderCountText(25, 'en')).toBe('25 riders');
	});
});
