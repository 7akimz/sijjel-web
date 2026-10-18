import type { Membership } from '#lib/api/types.js';

export function isAcademyRider(membership: Membership | null): boolean {
	return membership?.status === 'active' && membership.roles.includes('rider');
}
