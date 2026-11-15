import { isAcademyAdmin } from '#lib/academy/admin.js';
import { isAcademyRider } from '#lib/academy/rider.js';
import { isAcademyStaff } from '#lib/academy/staff.js';
import type { SetupState } from '#lib/api/academy-types.js';
import type { BoardSession } from '#lib/api/board-types.js';
import type { BookingView, PlanSummary } from '#lib/api/member-types.js';
import type { MyAcademy } from '#lib/api/types.js';
import { redirect } from '@sveltejs/kit';
import { apiLoad } from '#lib/server/api.js';
import { pushKey } from '#lib/server/push-key.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { locals } = event;
	if (locals.tenant.kind === 'platform') {
		const none = { setup: null, board: null, rider: null };
		if (!locals.user || locals.user.isPlatformAdmin) return { academies: null, ...none };
		const academies = await apiLoad<MyAcademy[]>(event, '/api/me/academies');
		// Someone in one academy came for that academy, so they go straight in.
		if (academies.length === 1) redirect(303, `/open/${academies[0].slug}`);
		return { academies, ...none };
	}
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
	// The push key is only needed to offer notifications under a session the academy cancelled.
	const offer = bookings?.some((b) => b.status === 'cancelled' && b.cancelledByAcademy);
	const publicKey = offer ? await pushKey(event) : null;
	return {
		academies: null,
		setup,
		board,
		rider: plan && bookings ? { plan, bookings, publicKey } : null
	};
};
