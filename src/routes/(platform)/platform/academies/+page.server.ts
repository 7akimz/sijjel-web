import type { AcademySummary, Discipline } from '#lib/api/types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const [academies, disciplines] = await Promise.all([
		apiLoad<AcademySummary[]>(event, '/api/platform/academies'),
		apiLoad<Discipline[]>(event, '/api/platform/disciplines')
	]);
	return { academies, disciplines };
};
