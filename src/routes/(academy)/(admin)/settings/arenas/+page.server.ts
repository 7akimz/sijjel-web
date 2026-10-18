import type { Arena } from '#lib/api/academy-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => ({
	arenas: await apiLoad<Arena[]>(event, '/api/academy/arenas')
});
