import type { FieldErrors } from '#lib/api/errors.js';
import type { HorseSource } from '#lib/api/member-types.js';

export type RiderForm = {
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

// riderErrors mirrors the API's rider checks: a discipline, a level and a plan.
export function riderErrors(f: RiderForm): FieldErrors {
	const errors: FieldErrors = {};
	if (!f.disciplineId) errors.disciplineId = ['discipline_unknown'];
	else if (!f.levelId) errors.levelId = ['level_range_invalid'];
	if (!f.planId) errors.planId = ['plan_required'];
	return errors;
}

export function inviteMemberErrors(f: InviteMemberForm): FieldErrors {
	const errors: FieldErrors = f.role === 'rider' ? riderErrors(f) : {};
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
	request.disciplineId = f.disciplineId;
	request.levelId = f.levelId;
	request.planId = f.planId;
	request.horseSource = f.horseSource;
	return request;
}
