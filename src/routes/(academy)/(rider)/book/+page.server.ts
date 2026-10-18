import type { PlanSummary, SlotView } from '#lib/api/member-types.js';
import { weekEndOf, weekStartOf } from '#lib/forms/booking.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export const load: PageServerLoad = async (event) => {
	const summary = await apiLoad<PlanSummary>(event, '/api/me/plan');
	const asked = event.url.searchParams.get('week');
	const week =
		asked &&
		isoDate.test(asked) &&
		!Number.isNaN(Date.parse(asked)) &&
		weekStartOf(asked) > summary.weekStart
			? weekStartOf(asked)
			: summary.weekStart;
	const slots = await apiLoad<SlotView[]>(event, `/api/slots?from=${week}&to=${weekEndOf(week)}`);
	return { summary, week, slots };
};
