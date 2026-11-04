import type { AcademyDisciplines, Horse } from '#lib/api/academy-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const [horse, disciplines] = await Promise.all([
		apiLoad<Horse>(event, `/api/academy/horses/${encodeURIComponent(event.params.id)}`),
		apiLoad<AcademyDisciplines>(event, '/api/academy/disciplines')
	]);
	return { horse, disciplines };
};
