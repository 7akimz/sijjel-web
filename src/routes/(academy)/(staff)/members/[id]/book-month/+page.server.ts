import { error } from '@sveltejs/kit';
import type { Member, MonthView } from '#lib/api/member-types.js';
import { monthChoice } from '#lib/forms/book-month.js';
import { apiLoad } from '#lib/server/api.js';
import { academyToday } from '#lib/server/today.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { tenant } = event.locals;
	if (tenant.kind !== 'academy') error(404, 'academy_not_found');
	const id = encodeURIComponent(event.params.id);
	const choice = monthChoice(
		academyToday(tenant.academy.timeZone),
		event.url.searchParams.get('month')
	);
	const [member, view] = await Promise.all([
		apiLoad<Member>(event, `/api/academy/members/${id}`),
		apiLoad<MonthView>(event, `/api/academy/members/${id}/month-bookings?month=${choice.month}`)
	]);
	return { member, view, ...choice };
};
