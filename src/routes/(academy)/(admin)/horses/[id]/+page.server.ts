import { error } from '@sveltejs/kit';
import type { Horse } from '#lib/api/academy-types.js';
import { apiLoad } from '#lib/server/api.js';
import { loadSetupFlow } from '#lib/server/setup.js';
import { academyToday } from '#lib/server/today.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { tenant } = event.locals;
	if (tenant.kind !== 'academy') error(404, 'academy_not_found');
	const [horse, setup] = await Promise.all([
		apiLoad<Horse>(event, `/api/academy/horses/${encodeURIComponent(event.params.id)}`),
		loadSetupFlow(event)
	]);
	return { horse, setup, today: academyToday(tenant.academy.timeZone) };
};
