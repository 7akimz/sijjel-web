import type { FieldErrors } from '#lib/api/errors.js';
import type { HorseSource } from '#lib/api/member-types.js';

type Numberish = string | number | null;

export type RiderForm = {
	age: Numberish;
	weightKg: Numberish;
	disciplineId: string;
	levelId: string;
	planId: string;
	horseSource: HorseSource;
};

export type InviteMemberForm = RiderForm & {
	role: 'admin' | 'trainer' | 'rider';
	name: string;
	phone: string;
};

export type RiderRules = {
	minRiderAge: number;
	maxRiderAge: number | null;
	maxRiderWeightKg: number | null;
};

export const optionalNumber = (value: Numberish): number | null =>
	value === null || String(value).trim() === '' ? null : Number(value);

// riderErrors mirrors the API's rider checks: the academy's age range (within what can be
// stored), the weight limit when the academy has one, a level and a plan.
export function riderErrors(f: RiderForm, rules: RiderRules): FieldErrors {
	const errors: FieldErrors = {};
	const age = optionalNumber(f.age);
	const tooYoungOrOld =
		age === null ||
		!Number.isInteger(age) ||
		age < Math.max(rules.minRiderAge, 3) ||
		age > Math.min(rules.maxRiderAge ?? 99, 99);
	if (tooYoungOrOld) errors.age = ['age_out_of_range'];
	const weight = optionalNumber(f.weightKg);
	const weightBad =
		(weight !== null && (!Number.isInteger(weight) || weight < 10 || weight > 250)) ||
		(rules.maxRiderWeightKg !== null && (weight === null || weight > rules.maxRiderWeightKg));
	if (weightBad) errors.weightKg = ['weight_out_of_range'];
	if (!f.disciplineId) errors.disciplineId = ['discipline_unknown'];
	else if (!f.levelId) errors.levelId = ['level_range_invalid'];
	if (!f.planId) errors.planId = ['plan_required'];
	return errors;
}

export function inviteMemberErrors(f: InviteMemberForm, rules: RiderRules): FieldErrors {
	const errors: FieldErrors = f.role === 'rider' ? riderErrors(f, rules) : {};
	const name = f.name.trim();
	if (!name) errors.name = ['name_required'];
	else if ([...name].length > 120) errors.name = ['name_too_long'];
	return errors;
}

export function toInviteRequest(f: InviteMemberForm) {
	const phone = f.phone.trim();
	const request: Record<string, unknown> = { role: f.role, name: f.name.trim() };
	if (phone) request.phone = phone;
	if (f.role !== 'rider') return request;
	const weight = optionalNumber(f.weightKg);
	request.age = optionalNumber(f.age);
	if (weight !== null) request.weightKg = weight;
	request.disciplineId = f.disciplineId;
	request.levelId = f.levelId;
	request.planId = f.planId;
	request.horseSource = f.horseSource;
	return request;
}
