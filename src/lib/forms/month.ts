import { monthKey, nextMonth } from './member';

/** The 1st of the month after `today` (both `YYYY-MM-DD`), when a new plan starts. */
export function firstOfNextMonth(today: string): string {
	return `${nextMonth(monthKey(today))}-01`;
}
