import { error, redirect } from '@sveltejs/kit';
import { isAcademyAdmin } from '#lib/academy/admin.js';
import type { AcademyDisciplines, BookingRules, Schedule } from '#lib/api/academy-types.js';
import type { BookingView, Member, Plan, RiderRides } from '#lib/api/member-types.js';
import { isStaffOnly } from '#lib/forms/member.js';
import { apiLoad } from '#lib/server/api.js';
import { academyToday } from '#lib/server/today.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { tenant } = event.locals;
	if (tenant.kind !== 'academy') error(404, 'academy_not_found');
	const id = encodeURIComponent(event.params.id);
	const admin = isAcademyAdmin(event.locals.membership);
	const tab = event.url.searchParams.get('tab') === 'rides' ? 'rides' : 'profile';
	const [member, bookings, disciplines, plans, schedule, rules, rides] = await Promise.all([
		apiLoad<Member>(event, `/api/academy/members/${id}`),
		apiLoad<BookingView[]>(event, `/api/academy/members/${id}/bookings`).catch(() => []),
		apiLoad<AcademyDisciplines>(event, '/api/academy/disciplines'),
		apiLoad<Plan[]>(event, '/api/academy/plans'),
		admin ? apiLoad<Schedule>(event, '/api/academy/schedule') : null,
		admin ? apiLoad<BookingRules>(event, '/api/academy/booking-rules') : null,
		tab === 'rides' ? apiLoad<RiderRides>(event, `/api/academy/members/${id}/rides`) : null
	]);
	if (isStaffOnly(member)) redirect(307, `/settings/staff/${encodeURIComponent(member.id)}`);
	const month = schedule ? academyToday(schedule.timeZone).slice(0, 7) : null;
	const today = academyToday(tenant.academy.timeZone);
	return {
		tab,
		rides,
		member,
		bookings,
		disciplines,
		plans,
		admin,
		month,
		today,
		currency: rules?.currency ?? null
	};
};
