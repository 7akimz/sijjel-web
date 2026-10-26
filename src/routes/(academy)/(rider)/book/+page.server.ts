import { error } from '@sveltejs/kit';
import type { PlanSummary, SlotView } from '#lib/api/member-types.js';
import { weekEndOf, weekStartOf } from '#lib/forms/booking.js';
import { apiLoad } from '#lib/server/api.js';
import { academyToday } from '#lib/server/today.js';
import type { PageServerLoad } from './$types';

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export const load: PageServerLoad = async (event) => {
	const { tenant } = event.locals;
	if (tenant.kind !== 'academy') error(404, 'academy_not_found');
	const summary = await apiLoad<PlanSummary>(event, '/api/me/plan');
	const firstWeek = weekStartOf(academyToday(tenant.academy.timeZone));
	const asked = event.url.searchParams.get('week');
	const week =
		asked &&
		isoDate.test(asked) &&
		!Number.isNaN(Date.parse(asked)) &&
		weekStartOf(asked) > firstWeek
			? weekStartOf(asked)
			: firstWeek;
	const slots = await apiLoad<SlotView[]>(event, `/api/slots?from=${week}&to=${weekEndOf(week)}`);
	return { summary, week, firstWeek, slots };
};
