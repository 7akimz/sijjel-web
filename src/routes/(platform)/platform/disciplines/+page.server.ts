import type { Discipline } from '#lib/api/types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => ({
	disciplines: await apiLoad<Discipline[]>(event, '/api/platform/disciplines')
});
