import type { BoardTime } from '#lib/api/board-types.js';

export interface DaySummary {
	sessions: BoardTime[];
	riders: number;
	unplaced: number;
	attention: number;
}

export function daySummary(times: BoardTime[]): DaySummary {
	const sessions = times.filter((t) => t.riders > 0);
	return {
		sessions,
		riders: sessions.reduce((n, t) => n + t.riders, 0),
		unplaced: sessions.reduce((n, t) => n + t.unplaced, 0),
		attention: sessions.filter((t) => t.hasProblem).length
	};
}
