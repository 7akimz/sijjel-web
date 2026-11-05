import { isAcademyAdmin } from '#lib/academy/admin.js';
import type { Member, PendingInvite } from '#lib/api/member-types.js';
import type { AcademySubscription } from '#lib/api/subscription-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const admin = isAcademyAdmin(event.locals.membership);
	const filter = admin && event.url.searchParams.get('filter') === 'unpaid' ? 'unpaid' : null;
	const query = filter ? '?role=rider&unpaid=true' : '?role=rider';
	const [members, pending, subscription] = await Promise.all([
		apiLoad<Member[]>(event, `/api/academy/members${query}`),
		admin ? apiLoad<PendingInvite[]>(event, '/api/academy/invites') : Promise.resolve([]),
		admin ? apiLoad<AcademySubscription>(event, '/api/academy/subscription') : Promise.resolve(null)
	]);
	return {
		members,
		pending: pending.filter((invite) => invite.role === 'rider'),
		filter,
		admin,
		riders: subscription?.riders ?? null
	};
};
