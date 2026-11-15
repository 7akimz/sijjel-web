import type { Membership } from '#lib/api/types.js';

export function isAcademyRider(membership: Membership | null): boolean {
	return membership?.status === 'active' && membership.roles.includes('rider');
}

/** Whether this rider books their own sessions; where staff book, they only see them. */
export function ridersBookHere(membership: Membership | null): boolean {
	return isAcademyRider(membership) && membership?.ridersBook === true;
}
