import type { Member, PendingInvite } from '#lib/api/member-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const [staff, pending] = await Promise.all([
		apiLoad<Member[]>(event, '/api/academy/members?role=staff'),
		apiLoad<PendingInvite[]>(event, '/api/academy/invites')
	]);
	return { staff, pending: pending.filter((invite) => invite.role !== 'rider') };
};
