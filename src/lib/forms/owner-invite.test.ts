import { describe, expect, it } from 'vitest';
import { ownerInviteErrors, toOwnerInviteRequest, type OwnerInviteForm } from './owner-invite';

const owner = (overrides: Partial<OwnerInviteForm> = {}): OwnerInviteForm => ({
	name: 'Layla',
	phone: '',
	email: '',
	...overrides
});

describe('ownerInviteErrors', () => {
	it('needs only a name', () => {
		expect(ownerInviteErrors(owner())).toEqual({});
		expect(ownerInviteErrors(owner({ name: '  ' }))).toEqual({ name: ['name_required'] });
		expect(ownerInviteErrors(owner({ name: 'x'.repeat(121) }))).toEqual({
			name: ['name_too_long']
		});
	});

	it('checks the email when one is given', () => {
		expect(ownerInviteErrors(owner({ email: 'layla@' }))).toEqual({ email: ['email_invalid'] });
		expect(ownerInviteErrors(owner({ email: ' layla@example.test ' }))).toEqual({});
	});
});

describe('toOwnerInviteRequest', () => {
	it('leaves out a blank phone and email', () => {
		expect(toOwnerInviteRequest(owner({ name: ' Layla ', phone: ' ', email: '' }))).toEqual({
			name: 'Layla'
		});
	});

	it('sends a trimmed phone and email', () => {
		expect(
			toOwnerInviteRequest(owner({ phone: ' 010 1234 5678 ', email: ' layla@example.test ' }))
		).toEqual({ name: 'Layla', phone: '010 1234 5678', email: 'layla@example.test' });
	});
});
