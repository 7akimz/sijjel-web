import type { Membership } from '#lib/api/types.js';

export function isAcademyStaff(membership: Membership | null): boolean {
	return (
		membership?.status === 'active' &&
		(membership.roles.includes('admin') || membership.roles.includes('trainer'))
	);
}
