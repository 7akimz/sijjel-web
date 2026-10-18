import type { AcademyDisciplines } from '#lib/api/academy-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => ({
	disciplines: await apiLoad<AcademyDisciplines>(event, '/api/academy/disciplines')
});
