import type { AcademyDisciplines } from '#lib/api/academy-types.js';
import { apiLoad } from '#lib/server/api.js';
import { loadSetupFlow } from '#lib/server/setup.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const [disciplines, setup] = await Promise.all([
		apiLoad<AcademyDisciplines>(event, '/api/academy/disciplines'),
		loadSetupFlow(event)
	]);
	return { disciplines, setup };
};
