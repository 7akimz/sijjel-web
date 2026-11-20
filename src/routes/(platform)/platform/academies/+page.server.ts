import type { AcademySummary } from '#lib/api/types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => ({
	academies: await apiLoad<AcademySummary[]>(event, '/api/platform/academies')
});
