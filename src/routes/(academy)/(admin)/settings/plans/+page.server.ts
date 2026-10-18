import type { AcademyDisciplines } from '#lib/api/academy-types.js';
import type { Plan } from '#lib/api/member-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const [plans, disciplines, rules] = await Promise.all([
		apiLoad<Plan[]>(event, '/api/academy/plans'),
		apiLoad<AcademyDisciplines>(event, '/api/academy/disciplines'),
		apiLoad<{ currency: string }>(event, '/api/academy/booking-rules')
	]);
	return { plans, disciplines, currency: rules.currency };
};
