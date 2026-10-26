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
	phone: string;
};

export const monthKey = (date: string) => date.slice(0, 7);

export function nextMonth(month: string): string {
	const [year, value] = month.split('-').map(Number);
	return value === 12 ? `${year + 1}-01` : `${year}-${String(value + 1).padStart(2, '0')}`;
}

/**
 * The hint under a rider's plan select: when a newly picked plan starts, or the plan change
 * already saved while the select still shows the current plan.
 */
export function planHint(
	planId: string,
	member: Member,
	today: string,
	locale: Locale
): string | undefined {
	if (planId && planId !== (member.plan?.id ?? '')) {
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

export function memberFormFrom(m: Member): MemberForm {
	return {
		displayName: m.displayName,
		roles: [...m.roles],
		phone: m.phone ?? '',
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
	const phone = f.phone.trim();
	const base = { displayName: f.displayName.trim(), roles: f.roles, phone: phone || null };
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
