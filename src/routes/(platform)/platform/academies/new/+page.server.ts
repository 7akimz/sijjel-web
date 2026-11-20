import type { Package } from '#lib/api/subscription-types.js';
import type { Country, Discipline } from '#lib/api/types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const [disciplines, countries, packages] = await Promise.all([
		apiLoad<Discipline[]>(event, '/api/platform/disciplines'),
		apiLoad<Country[]>(event, '/api/platform/countries'),
		apiLoad<Package[]>(event, '/api/platform/packages')
	]);
	return { disciplines, countries, packages };
};
