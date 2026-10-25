import { isAcademyAdmin } from '#lib/academy/admin.js';
import { isAcademyRider } from '#lib/academy/rider.js';
import { isAcademyStaff } from '#lib/academy/staff.js';
import type { SetupState } from '#lib/api/academy-types.js';
import type { BoardSession } from '#lib/api/board-types.js';
import type { BookingView, PlanSummary } from '#lib/api/member-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { locals } = event;
	const academy = locals.tenant.kind === 'academy';
	const admin = academy && isAcademyAdmin(locals.membership);
	const rider = academy && isAcademyRider(locals.membership);
	const today = academy && isAcademyStaff(locals.membership) && !!locals.membership?.setupDone;
	const [setup, plan, bookings, board] = await Promise.all([
		admin ? apiLoad<SetupState>(event, '/api/academy/setup') : null,
		rider ? apiLoad<PlanSummary>(event, '/api/me/plan') : null,
		rider ? apiLoad<BookingView[]>(event, '/api/me/bookings') : null,
		today ? apiLoad<BoardSession>(event, '/api/board') : null
	]);
	return { setup, board, rider: plan && bookings ? { plan, bookings } : null };
};
