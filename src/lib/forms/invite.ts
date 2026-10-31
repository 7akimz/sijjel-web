import type { ApiError, FieldErrors } from '#lib/api/errors.js';

export interface InviteSignUp {
	displayName: string;
	phone: string;
	email: string;
	password: string;
}

export interface SignUpRequest {
	displayName: string;
	phone: string;
	email: string | null;
	password: string;
}

/** What the invite already says about its recipient. */
export interface Invited {
	email?: string | null;
	phone?: string | null;
	phoneLocked?: boolean;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 10;

export function toSignUpRequest(form: InviteSignUp): SignUpRequest {
	const email = form.email.trim();
	return {
		displayName: form.displayName.trim(),
		phone: form.phone.trim(),
		email: email || null,
		password: form.password
	};
}

/**
 * Checks what the browser can. A phone typed in Arabic or with spaces can't be compared with the
 * invite's reliably here, so the API decides `phone_mismatch`.
 */
export function inviteFormErrors(form: InviteSignUp, invited: Invited): FieldErrors {
	const { displayName, phone, email, password } = toSignUpRequest(form);
	const errors: FieldErrors = {};
	if (!displayName) errors.displayName = ['name_required'];
	if (!phone) errors.phone = ['phone_invalid'];
	if (email && !EMAIL_PATTERN.test(email)) {
		errors.email = ['email_invalid'];
	} else if (invited.email && email?.toLowerCase() !== invited.email.trim().toLowerCase()) {
		errors.email = ['email_mismatch'];
	}
	if ([...password].length < MIN_PASSWORD_LENGTH) errors.password = ['password_too_short'];
	return errors;
}

/** The phone or email to sign in with, when sign-up failed because it already has an account. */
export function existingAccount(error: ApiError, form: InviteSignUp): string | null {
	if (error.code === 'phone_taken') return form.phone.trim();
	if (error.code === 'email_taken') return form.email.trim();
	return null;
}
