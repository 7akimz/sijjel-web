import { describe, expect, it } from 'vitest';
import { inviteMemberErrors, toInviteRequest, type InviteMemberForm } from './invite-member';

const rules = { minRiderAge: 6, maxRiderAge: null, maxRiderWeightKg: null };

const rider = (overrides: Partial<InviteMemberForm> = {}): InviteMemberForm => ({
	role: 'rider',
	name: 'Layla',
	phone: '',
	age: 14,
	weightKg: '',
	disciplineId: 'd',
	levelId: 'l1',
	planId: 'p',
	horseSource: 'school',
	...overrides
});

describe('inviteMemberErrors', () => {
	it('accepts a complete rider', () => {
		expect(inviteMemberErrors(rider(), rules)).toEqual({});
	});

	it('checks the age range, plan and weight limit for riders', () => {
		expect(inviteMemberErrors(rider({ age: 5 }), rules)).toEqual({ age: ['age_out_of_range'] });
		expect(inviteMemberErrors(rider({ planId: '' }), rules)).toEqual({ planId: ['plan_required'] });
		expect(inviteMemberErrors(rider(), { ...rules, maxRiderWeightKg: 80 })).toEqual({
			weightKg: ['weight_out_of_range']
		});
		expect(inviteMemberErrors(rider({ weightKg: 85 }), { ...rules, maxRiderWeightKg: 80 })).toEqual(
			{
				weightKg: ['weight_out_of_range']
			}
		);
	});

	it('only needs a name for staff', () => {
		expect(inviteMemberErrors(rider({ role: 'trainer', age: null, planId: '' }), rules)).toEqual(
			{}
		);
		expect(inviteMemberErrors(rider({ role: 'trainer', name: ' ' }), rules)).toEqual({
			name: ['name_required']
		});
	});
});

describe('toInviteRequest', () => {
	it('sends rider fields only for riders', () => {
		const request = toInviteRequest(rider({ role: 'trainer', phone: ' 010 ' }));

		expect(request).toEqual({ role: 'trainer', name: 'Layla', phone: '010' });
	});

	it('drops a blank weight and keeps the rest for riders', () => {
		expect(toInviteRequest(rider())).toEqual({
			role: 'rider',
			name: 'Layla',
			age: 14,
			disciplineId: 'd',
			levelId: 'l1',
			planId: 'p',
			horseSource: 'school'
		});
	});
});
