import { describe, expect, it } from 'vitest';
import { daySummary } from './home';

const time = (start: string, riders: number, unplaced: number, hasProblem = false) => ({
	start,
	end: '',
	riders,
	unplaced,
	hasProblem
});

describe('daySummary', () => {
	it('adds up the sessions that have riders', () => {
		const summary = daySummary([
			time('17:30', 0, 0),
			time('18:00', 3, 1, true),
			time('18:30', 2, 0),
			time('19:00', 4, 4, true)
		]);

		expect(summary.sessions.map((s) => s.start)).toEqual(['18:00', '18:30', '19:00']);
		expect(summary).toMatchObject({ riders: 9, unplaced: 5, attention: 2 });
	});

	it('is empty on a day without riders', () => {
		expect(daySummary([time('18:00', 0, 0)])).toEqual({
			sessions: [],
			riders: 0,
			unplaced: 0,
			attention: 0
		});
	});
});
