import { error } from '@sveltejs/kit';
import { isAcademyAdmin } from '#lib/academy/admin.js';
import type { AcademyDisciplines, Schedule } from '#lib/api/academy-types.js';
import type { BookingView, Member, Plan } from '#lib/api/member-types.js';
import { apiLoad } from '#lib/server/api.js';
import { academyToday } from '#lib/server/today.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { tenant } = event.locals;
	if (tenant.kind !== 'academy') error(404, 'academy_not_found');
	const id = encodeURIComponent(event.params.id);
	const admin = isAcademyAdmin(event.locals.membership);
	const [member, bookings, disciplines, plans, schedule] = await Promise.all([
		apiLoad<Member>(event, `/api/academy/members/${id}`),
		apiLoad<BookingView[]>(event, `/api/academy/members/${id}/bookings`).catch(() => []),
		apiLoad<AcademyDisciplines>(event, '/api/academy/disciplines'),
		apiLoad<Plan[]>(event, '/api/academy/plans'),
		admin ? apiLoad<Schedule>(event, '/api/academy/schedule') : null
	]);
	const month = schedule ? academyToday(schedule.timeZone).slice(0, 7) : null;
	const today = academyToday(tenant.academy.timeZone);
	return { member, bookings, disciplines, plans, admin, month, today };
};
