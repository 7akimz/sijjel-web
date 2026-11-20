import { error } from '@sveltejs/kit';
import type { AcademySubscription, Package } from '#lib/api/subscription-types.js';
import type { AcademySummary, Country } from '#lib/api/types.js';
import { academyTab } from '#lib/forms/academy-page.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const [subscription, packages, academies, countries] = await Promise.all([
		apiLoad<AcademySubscription>(event, `/api/platform/academies/${event.params.id}/subscription`),
		apiLoad<Package[]>(event, '/api/platform/packages'),
		apiLoad<AcademySummary[]>(event, '/api/platform/academies'),
		apiLoad<Country[]>(event, '/api/platform/countries')
	]);
	const academy = academies.find((a) => a.id === event.params.id);
	if (!academy) error(404, 'academy_not_found');
	return {
		subscription,
		packages,
		academy,
		countries,
		tab: academyTab(event.url.searchParams.get('tab')),
		added: event.url.searchParams.get('added') === '1'
	};
};
