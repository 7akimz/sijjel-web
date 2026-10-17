import type { FieldErrors } from '#lib/api/errors.js';

export interface InviteSignUp {
	displayName: string;
	email: string;
	password: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 10;

export function toSignUpRequest(form: InviteSignUp): InviteSignUp {
	return { ...form, displayName: form.displayName.trim(), email: form.email.trim() };
}

export function inviteFormErrors(form: InviteSignUp, invitedEmail?: string | null): FieldErrors {
	const { displayName, email, password } = toSignUpRequest(form);
	const errors: FieldErrors = {};
	if (!displayName) errors.displayName = ['name_required'];
	if (!EMAIL_PATTERN.test(email)) {
		errors.email = ['email_invalid'];
	} else if (invitedEmail && email.toLowerCase() !== invitedEmail.trim().toLowerCase()) {
		errors.email = ['email_mismatch'];
	}
	if ([...password].length < MIN_PASSWORD_LENGTH) errors.password = ['password_too_short'];
	return errors;
}
