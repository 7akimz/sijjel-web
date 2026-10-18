import { isAcademyAdmin } from '#lib/academy/admin.js';
import { isAcademyRider } from '#lib/academy/rider.js';
import type { SetupState } from '#lib/api/academy-types.js';
import type { BookingView, PlanSummary } from '#lib/api/member-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { locals } = event;
	const academy = locals.tenant.kind === 'academy';
	const admin = academy && isAcademyAdmin(locals.membership);
	const rider = academy && isAcademyRider(locals.membership);
	const [setup, plan, bookings] = await Promise.all([
		admin ? apiLoad<SetupState>(event, '/api/academy/setup') : null,
		rider ? apiLoad<PlanSummary>(event, '/api/me/plan') : null,
		rider ? apiLoad<BookingView[]>(event, '/api/me/bookings') : null
	]);
	return { setup, rider: plan && bookings ? { plan, bookings } : null };
};
