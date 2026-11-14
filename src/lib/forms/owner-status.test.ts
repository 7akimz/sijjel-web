import { describe, expect, it } from 'vitest';
import type { SubscriptionEntry } from '#lib/api/subscription-types.js';
import type { OwnerStatus, SetupSummary } from '#lib/api/types.js';
import {
	ownerChip,
	ownerDateText,
	ownerEntryText,
	ownerStatusText,
	ownerStatusTone,
	setupChip
} from './owner-status';

const now = new Date('2026-11-14T10:00:00Z');
const owner = (o: Partial<OwnerStatus>): OwnerStatus => ({
	state: 'none',
	name: null,
	inviteId: null,
	sentAt: null,
	expiresAt: null,
	joinedAt: null,
	...o
});

describe('ownerChip', () => {
	it('says no invite was sent', () => {
		expect(ownerChip(owner({}), now, 'en')).toEqual({ text: 'No invite sent', tone: 'stone' });
	});
	it('counts the days since the invite was sent', () => {
		const sent = (at: string) =>
			owner({ state: 'pending', sentAt: at, expiresAt: '2026-11-28T10:00:00Z' });
		expect(ownerChip(sent('2026-11-14T08:00:00Z'), now, 'en')).toEqual({
			text: 'Invite sent today, not accepted yet',
			tone: 'pending'
		});
		expect(ownerChip(sent('2026-11-13T20:00:00Z'), now, 'en').text).toBe(
			'Invite sent yesterday, not accepted yet'
		);
		expect(ownerChip(sent('2026-11-11T09:00:00Z'), now, 'en').text).toBe(
			'Invite sent 3 days ago, not accepted yet'
		);
	});
	it('gives the day an invite expired', () => {
		const o = owner({
			state: 'expired',
			sentAt: '2026-10-19T09:00:00Z',
			expiresAt: '2026-11-02T09:00:00Z'
		});
		expect(ownerChip(o, now, 'en')).toEqual({ text: 'Invite expired on 2 Nov', tone: 'stone' });
	});
	it('names the owner', () => {
		const o = owner({ state: 'joined', name: 'Omar Said', joinedAt: '2026-11-01T09:00:00Z' });
		expect(ownerChip(o, now, 'en')).toEqual({ text: 'Owner: Omar Said', tone: 'active' });
	});
});

describe('setupChip', () => {
	const setup = (s: Partial<SetupSummary>): SetupSummary => ({
		done: 0,
		total: 4,
		steps: { hours: false, arenas: false, horses: false, plans: false },
		finished: false,
		doneOn: null,
		...s
	});
	it('counts the steps done', () => {
		expect(setupChip(setup({ done: 2 }), 'en')).toBe('Setup: 2 of 4');
	});
	it('gives the setup day', () => {
		expect(setupChip(setup({ done: 4, finished: true, doneOn: '2026-12-03' }), 'en')).toBe(
			'Set up on 3 Dec'
		);
	});
	it('says set up when the day is not known', () => {
		expect(setupChip(setup({ done: 4, finished: true }), 'en')).toBe('Set up');
	});
	it('keeps saying set up after a step is removed', () => {
		expect(setupChip(setup({ done: 3, finished: true, doneOn: '2026-12-03' }), 'en')).toBe(
			'Set up on 3 Dec'
		);
	});
});

describe('owner wording', () => {
	it('shows free days as active and hides the waiting state', () => {
		expect(ownerStatusText('free', 'en')).toBe('Active');
		expect(ownerStatusTone('free', false)).toBe('active');
		expect(ownerStatusText('not_started', 'en')).toBeNull();
		expect(ownerStatusText('paid', 'en')).toBe('Paid');
	});
	it('gives the next payment for free days and paid until otherwise', () => {
		expect(ownerDateText('free', '2027-01-02', 'en')).toBe('Next payment due on 2 January 2027');
		expect(ownerDateText('paid', '2027-01-02', 'en')).toBe('Paid until 2 January 2027');
		expect(ownerDateText('not_started', null, 'en')).toBeNull();
	});
	const entry = (e: Partial<SubscriptionEntry>): SubscriptionEntry => ({
		id: 'e',
		kind: 'free',
		amount: null,
		method: null,
		days: 30,
		note: null,
		startsOn: '2026-12-03',
		endsOn: '2027-01-02',
		madeBy: 'admin@sijjel.com',
		madeAt: '2026-12-03T09:00:00Z',
		...e
	});
	it('calls the first free entry the first month, whatever its length', () => {
		expect(ownerEntryText(entry({}), true, 'en')).toBe('First month · 3 Dec → 2 Jan');
	});
	it('calls later free entries extra time', () => {
		const later = entry({ days: 14, startsOn: '2027-01-03', endsOn: '2027-01-17' });
		expect(ownerEntryText(later, false, 'en')).toBe('Extra time · 14 days · 3 Jan → 17 Jan');
	});
	it('never says free or names who recorded it', () => {
		const paid = entry({ kind: 'paid', amount: 1500, method: 'cash', days: null });
		const text = ownerEntryText(paid, true, 'en');
		expect(text).toContain('Paid month');
		expect(text).not.toContain('admin@sijjel.com');
		expect(ownerEntryText(entry({}), false, 'en')).not.toMatch(/free/i);
	});
});
