import type { Membership } from '#lib/api/types.js';

export function isAcademyAdmin(membership: Membership | null): boolean {
	return membership?.status === 'active' && membership.roles.includes('admin');
}
