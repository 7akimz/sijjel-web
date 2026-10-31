import type { FieldErrors } from '#lib/api/errors.js';
import { EMAIL_PATTERN } from './invite';

export type OwnerInviteForm = {
	name: string;
	phone: string;
	email: string;
};

export function ownerInviteErrors(f: OwnerInviteForm): FieldErrors {
	const errors: FieldErrors = {};
	const name = f.name.trim();
	if (!name) errors.name = ['name_required'];
	else if ([...name].length > 120) errors.name = ['name_too_long'];
	const email = f.email.trim();
	if (email && !EMAIL_PATTERN.test(email)) errors.email = ['email_invalid'];
	return errors;
}

export function toOwnerInviteRequest(f: OwnerInviteForm) {
	const request: Record<string, string> = { name: f.name.trim() };
	const phone = f.phone.trim();
	const email = f.email.trim();
	if (phone) request.phone = phone;
	if (email) request.email = email;
	return request;
}
