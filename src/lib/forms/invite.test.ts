import { describe, expect, it } from 'vitest';
import { inviteFormErrors, type InviteSignUp } from './invite';

const form = (overrides: Partial<InviteSignUp> = {}): InviteSignUp => ({
	displayName: 'Layla',
	email: 'layla@example.test',
	password: 'long-enough-1',
	...overrides
});

describe('inviteFormErrors', () => {
	it('accepts a complete sign-up', () => {
		expect(inviteFormErrors(form())).toEqual({});
	});

	it('requires a name, a valid email and a 10 character password', () => {
		expect(inviteFormErrors(form({ displayName: ' ', email: 'layla', password: 'short' }))).toEqual(
			{
				displayName: ['name_required'],
				email: ['email_invalid'],
				password: ['password_too_short']
			}
		);
	});

	it('requires the invited email when the invite names one, ignoring case and spaces', () => {
		expect(inviteFormErrors(form({ email: ' Layla@Example.test ' }), 'layla@example.test')).toEqual(
			{}
		);
		expect(inviteFormErrors(form({ email: 'other@example.test' }), 'layla@example.test')).toEqual({
			email: ['email_mismatch']
		});
	});
});
