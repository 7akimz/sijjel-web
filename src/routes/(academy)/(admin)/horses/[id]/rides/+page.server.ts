import { error } from '@sveltejs/kit';
import type { Horse, HorseRides } from '#lib/api/academy-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.tenant.kind !== 'academy') error(404, 'academy_not_found');
	const path = `/api/academy/horses/${encodeURIComponent(event.params.id)}`;
	const [horse, rides] = await Promise.all([
		apiLoad<Horse>(event, path),
		apiLoad<HorseRides>(event, `${path}/rides`)
	]);
	return { horse, rides };
};
