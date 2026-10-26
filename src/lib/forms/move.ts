import type { AcademyLevel } from '#lib/api/academy-types.js';

/** The level after `levelId` on a ladder that is already in order. */
export function nextLevel(ladder: AcademyLevel[], levelId: string): AcademyLevel | null {
	const at = ladder.findIndex((l) => l.id === levelId);
	return at === -1 ? null : (ladder[at + 1] ?? null);
}
