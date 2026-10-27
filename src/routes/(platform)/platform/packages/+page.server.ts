import type { Package } from '#lib/api/subscription-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => ({
	packages: await apiLoad<Package[]>(event, '/api/platform/packages')
});
