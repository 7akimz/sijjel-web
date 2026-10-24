import type { AcademyDisciplines, Horse } from '#lib/api/academy-types.js';
import { apiLoad } from '#lib/server/api.js';
import { loadSetupFlow } from '#lib/server/setup.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const [horse, disciplines, setup] = await Promise.all([
		apiLoad<Horse>(event, `/api/academy/horses/${encodeURIComponent(event.params.id)}`),
		apiLoad<AcademyDisciplines>(event, '/api/academy/disciplines'),
		loadSetupFlow(event)
	]);
	return { horse, disciplines, setup };
};
