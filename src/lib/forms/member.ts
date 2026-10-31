import { localName } from '#lib/academy.js';
import type { FieldErrors } from '#lib/api/errors.js';
import type { HorseSource, Member, MemberInput } from '#lib/api/member-types.js';
import type { Locale } from '#lib/api/types.js';
import { formatDate, formatDayMonth } from '#lib/format.js';
import { m } from '#lib/paraglide/messages.js';
import { optionalNumber, riderErrors, type RiderForm, type RiderRules } from './invite-member';

export type MemberForm = RiderForm & {
	displayName: string;
	roles: Member['roles'];
};

export const monthKey = (date: string) => date.slice(0, 7);

export function nextMonth(month: string): string {
	const [year, value] = month.split('-').map(Number);
	return value === 12 ? `${year + 1}-01` : `${year}-${String(value + 1).padStart(2, '0')}`;
}

/**
 * The hint under a rider's plan select: when a newly picked plan starts, or the plan change
 * already saved while the select still shows the current plan. A rider with no plan yet starts
 * the picked one at once, so it needs no hint.
 */
export function planHint(
	planId: string,
	member: Member,
	today: string,
	locale: Locale
): string | undefined {
	if (planId && member.plan && planId !== member.plan.id) {
		const first = `${nextMonth(monthKey(today))}-01`;
		return m.member_plan_from({ date: formatDate(first, locale) }, { locale });
	}
	if (!member.comingPlan) return undefined;
	return m.member_plan_coming(
		{
			plan: localName(member.comingPlan.plan, locale),
			date: formatDayMonth(member.comingPlan.from, locale)
		},
		{ locale }
	);
}

/** A rider staff can move: the rider role, with a discipline and a level to move from. */
export function isLevelledRider(member: Member): boolean {
	return member.roles.includes('rider') && member.discipline !== null && member.level !== null;
}

/**
 * The profile form after a move: the rider's new discipline, level and plan, except a plan
 * picked in the form and not saved yet, which stays picked.
 */
export function formAfterMove(form: MemberForm, before: Member, after: Member): MemberForm {
	const picked = form.planId !== (before.plan?.id ?? '');
	return {
		...form,
		disciplineId: after.discipline?.id ?? '',
		levelId: after.level?.id ?? '',
		planId: picked ? form.planId : (after.plan?.id ?? '')
	};
}

export function memberFormFrom(m: Member): MemberForm {
	return {
		displayName: m.displayName,
		roles: [...m.roles],
		age: m.age ?? '',
		weightKg: m.weightKg ?? '',
		disciplineId: m.discipline?.id ?? '',
		levelId: m.level?.id ?? '',
		planId: m.plan?.id ?? '',
		horseSource: (m.horseSource ?? 'school') as HorseSource
	};
}

export function memberErrors(f: MemberForm, rules: RiderRules): FieldErrors {
	const errors: FieldErrors = f.roles.includes('rider') ? riderErrors(f, rules) : {};
	if (!f.displayName.trim()) errors.displayName = ['name_required'];
	if (f.roles.length === 0) errors.roles = ['role_invalid'];
	return errors;
}

export function toMemberInput(f: MemberForm): MemberInput | Omit<MemberInput, keyof RiderForm> {
	const base = { displayName: f.displayName.trim(), roles: f.roles };
	if (!f.roles.includes('rider')) return base;
	return {
		...base,
		age: optionalNumber(f.age),
		weightKg: optionalNumber(f.weightKg),
		disciplineId: f.disciplineId || null,
		levelId: f.levelId || null,
		planId: f.planId || null,
		horseSource: f.horseSource
	};
}

/** The chip shown for a member who no longer uses the academy, or null while they do. */
export function inactiveLabel(status: Member['status']): string | null {
	if (status === 'left') return m.member_left();
	if (status === 'suspended') return m.member_suspended();
	return null;
}

/** What a member hears after opening an invite to an academy they already belong to. */
export function alreadyMemberText(status: Member['status']): string {
	return status === 'active' ? m.invite_accepted_already() : m.invite_ask_reactivate();
}
