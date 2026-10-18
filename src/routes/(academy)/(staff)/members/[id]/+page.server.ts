import { isAcademyAdmin } from '#lib/academy/admin.js';
import type { AcademyDisciplines, BookingRules, Schedule } from '#lib/api/academy-types.js';
import type { BookingView, Member, Plan } from '#lib/api/member-types.js';
import { apiLoad } from '#lib/server/api.js';
import { academyToday } from '#lib/server/today.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const id = encodeURIComponent(event.params.id);
	const admin = isAcademyAdmin(event.locals.membership);
	const [member, bookings, disciplines, plans, rules, schedule] = await Promise.all([
		apiLoad<Member>(event, `/api/academy/members/${id}`),
		apiLoad<BookingView[]>(event, `/api/academy/members/${id}/bookings`).catch(() => []),
		admin ? apiLoad<AcademyDisciplines>(event, '/api/academy/disciplines') : null,
		admin ? apiLoad<Plan[]>(event, '/api/academy/plans') : null,
		admin ? apiLoad<BookingRules>(event, '/api/academy/booking-rules') : null,
		admin ? apiLoad<Schedule>(event, '/api/academy/schedule') : null
	]);
	const month = schedule ? academyToday(schedule.timeZone).slice(0, 7) : null;
	return { member, bookings, disciplines, plans, rules, admin, month };
};
