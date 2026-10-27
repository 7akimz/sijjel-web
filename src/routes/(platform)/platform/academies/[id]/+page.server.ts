import { error } from '@sveltejs/kit';
import type { AcademySubscription, Package } from '#lib/api/subscription-types.js';
import type { AcademySummary } from '#lib/api/types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const [subscription, packages, academies] = await Promise.all([
		apiLoad<AcademySubscription>(event, `/api/platform/academies/${event.params.id}/subscription`),
		apiLoad<Package[]>(event, '/api/platform/packages'),
		apiLoad<AcademySummary[]>(event, '/api/platform/academies')
	]);
	const academy = academies.find((a) => a.id === event.params.id);
	if (!academy) error(404, 'academy_not_found');
	return { subscription, packages, academy };
};
