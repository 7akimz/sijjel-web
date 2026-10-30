import { describe, expect, it } from 'vitest';
import { ApiError } from '#lib/api/errors.js';
import { existingAccount, inviteFormErrors, toSignUpRequest, type InviteSignUp } from './invite';

const form = (overrides: Partial<InviteSignUp> = {}): InviteSignUp => ({
	displayName: 'Layla',
	phone: '010 1234 5678',
	email: 'layla@example.test',
	password: 'long-enough-1',
	...overrides
});

describe('inviteFormErrors', () => {
	it('accepts a complete sign-up', () => {
		expect(inviteFormErrors(form(), {})).toEqual({});
	});

	it('requires a name, a phone, a valid email when given and a 10 character password', () => {
		expect(
			inviteFormErrors(
				form({ displayName: ' ', phone: ' ', email: 'layla', password: 'short' }),
				{}
			)
		).toEqual({
			displayName: ['name_required'],
			phone: ['phone_invalid'],
			email: ['email_invalid'],
			password: ['password_too_short']
		});
	});

	it('accepts Arabic digits and no email', () => {
		expect(inviteFormErrors(form({ phone: '٠١٠١٢٣٤٥٦٧٨', email: '' }), {})).toEqual({});
	});

	it('requires the invited email when the invite names one, ignoring case and spaces', () => {
		const invited = { email: 'layla@example.test' };
		expect(inviteFormErrors(form({ email: ' Layla@Example.test ' }), invited)).toEqual({});
		expect(inviteFormErrors(form({ email: 'other@example.test' }), invited)).toEqual({
			email: ['email_mismatch']
		});
	});
});

describe('toSignUpRequest', () => {
	it('trims every field and sends a blank email as null', () => {
		expect(toSignUpRequest(form({ displayName: ' Layla ', phone: ' 010 ', email: '  ' }))).toEqual({
			displayName: 'Layla',
			phone: '010',
			email: null,
			password: 'long-enough-1'
		});
	});
});

describe('existingAccount', () => {
	it('names the phone or email that already has an account', () => {
		expect(existingAccount(new ApiError(409, 'phone_taken'), form({ phone: ' 0101 ' }))).toBe(
			'0101'
		);
		expect(existingAccount(new ApiError(409, 'email_taken'), form())).toBe('layla@example.test');
		expect(existingAccount(new ApiError(409, 'already_member'), form())).toBeNull();
	});
});
