import type { Plan } from '#lib/api/member-types.js';

/**
 * A plan fits a rider when it has no discipline, or it is for the rider's discipline and covers
 * every level or the rider's. The API enforces the same rule.
 */
export function planFits(plan: Plan, disciplineId: string, levelId: string): boolean {
	if (!plan.discipline) return true;
	const levels = plan.levels ?? [];
	return (
		plan.discipline.id === disciplineId &&
		(levels.length === 0 || levels.some((l) => l.id === levelId))
	);
}

/** The active plans that fit, plus the plan `keep` (a rider's current one) whatever its state. */
export function plansFor(
	plans: Plan[],
	disciplineId: string,
	levelId: string,
	keep?: string
): Plan[] {
	return plans.filter((p) => p.id === keep || (p.isActive && planFits(p, disciplineId, levelId)));
}

/** Whether some active plan takes riders in the discipline, at any of its levels. */
export function disciplineHasPlan(plans: Plan[], disciplineId: string): boolean {
	return plans.some((p) => p.isActive && (!p.discipline || p.discipline.id === disciplineId));
}
