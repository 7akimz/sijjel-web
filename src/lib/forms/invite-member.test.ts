import { describe, expect, it } from 'vitest';
import { inviteMemberErrors, toInviteRequest, type InviteMemberForm } from './invite-member';

const rider = (overrides: Partial<InviteMemberForm> = {}): InviteMemberForm => ({
	role: 'rider',
	name: 'Layla',
	phone: '',
	disciplineId: 'd',
	levelId: 'l1',
	planId: 'p',
	horseSource: 'school',
	...overrides
});

describe('inviteMemberErrors', () => {
	it('accepts a complete rider', () => {
		expect(inviteMemberErrors(rider())).toEqual({});
	});

	it('checks the plan and level for riders', () => {
		expect(inviteMemberErrors(rider({ planId: '' }))).toEqual({ planId: ['plan_required'] });
		expect(inviteMemberErrors(rider({ levelId: '' }))).toEqual({
			levelId: ['level_range_invalid']
		});
	});

	it('only needs a name for staff', () => {
		expect(inviteMemberErrors(rider({ role: 'trainer', planId: '' }))).toEqual({});
		expect(inviteMemberErrors(rider({ role: 'trainer', name: ' ' }))).toEqual({
			name: ['name_required']
		});
	});
});

describe('toInviteRequest', () => {
	it('sends rider fields only for riders', () => {
		const request = toInviteRequest(rider({ role: 'trainer', phone: ' 010 ' }));

		expect(request).toEqual({ role: 'trainer', name: 'Layla', phone: '010' });
	});

	it('sends no age or weight for riders', () => {
		expect(toInviteRequest(rider())).toEqual({
			role: 'rider',
			name: 'Layla',
			disciplineId: 'd',
			levelId: 'l1',
			planId: 'p',
			horseSource: 'school'
		});
	});
});
