import { describe, expect, it } from 'vitest';
import { academyToday } from './today';

describe('academyToday', () => {
	it('uses the academy calendar, not UTC', () => {
		const lateUtcEvening = new Date('2026-10-19T22:30:00Z');

		expect(academyToday('Asia/Riyadh', lateUtcEvening)).toBe('2026-10-20');
		expect(academyToday('UTC', lateUtcEvening)).toBe('2026-10-19');
	});
});
