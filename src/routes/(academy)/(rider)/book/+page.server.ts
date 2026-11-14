import { error } from '@sveltejs/kit';
import type { PlanSummary, SlotView } from '#lib/api/member-types.js';
import { riderPage } from '#lib/forms/booking.js';
import { apiLoad } from '#lib/server/api.js';
import { pushKey } from '#lib/server/push-key.js';
import { academyToday } from '#lib/server/today.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { tenant } = event.locals;
	if (tenant.kind !== 'academy') error(404, 'academy_not_found');
	const summary = await apiLoad<PlanSummary>(event, '/api/me/plan');
	const today = academyToday(tenant.academy.timeZone);
	const page = riderPage(today, summary.bookingWindowDays, event.url.searchParams.get('week'));
	const [slots, publicKey] = await Promise.all([
		apiLoad<SlotView[]>(event, `/api/slots?from=${page.start}&to=${page.end}`),
		pushKey(event)
	]);
	return { summary, today, page, slots, publicKey };
};
