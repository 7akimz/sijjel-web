import { describe, expect, it } from 'vitest';
import { DEFAULT_TIME_ZONE, TIME_ZONES } from './time-zones';

describe('time zones', () => {
	it('defaults to Cairo', () => {
		expect(DEFAULT_TIME_ZONE).toBe('Africa/Cairo');
		expect(TIME_ZONES).toContain(DEFAULT_TIME_ZONE);
	});
});
