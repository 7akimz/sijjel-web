import { isAcademyAdmin } from '#lib/academy/admin.js';
import type { Member, PendingInvite } from '#lib/api/member-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

const FILTERS = new Set(['rider', 'trainer', 'unpaid']);

export const load: PageServerLoad = async (event) => {
	const raw = event.url.searchParams.get('filter');
	const filter = raw && FILTERS.has(raw) ? raw : null;
	const query = filter === 'unpaid' ? '?unpaid=true' : filter ? `?role=${filter}` : '';
	const admin = isAcademyAdmin(event.locals.membership);
	const [members, pending] = await Promise.all([
		apiLoad<Member[]>(event, `/api/academy/members${query}`),
		admin ? apiLoad<PendingInvite[]>(event, '/api/academy/invites') : Promise.resolve([])
	]);
	return { members, pending, filter, admin };
};
