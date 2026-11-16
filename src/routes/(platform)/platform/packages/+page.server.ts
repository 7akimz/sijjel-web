import type { Package } from '#lib/api/subscription-types.js';
import type { Country } from '#lib/api/types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const [packages, countries] = await Promise.all([
		apiLoad<Package[]>(event, '/api/platform/packages'),
		apiLoad<Country[]>(event, '/api/platform/countries')
	]);
	return { packages, countries };
};
