import type { AcademyDisciplines, Horse } from '#lib/api/academy-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const discipline = event.url.searchParams.get('discipline');
	const query = discipline ? `?discipline=${encodeURIComponent(discipline)}` : '';
	const [horses, disciplines] = await Promise.all([
		apiLoad<Horse[]>(event, `/api/academy/horses${query}`),
		apiLoad<AcademyDisciplines>(event, '/api/academy/disciplines')
	]);
	return { horses, disciplines, discipline };
};
