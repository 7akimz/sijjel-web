import type { AcademyDisciplines, BookingRules } from '#lib/api/academy-types.js';
import type { Plan } from '#lib/api/member-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const [disciplines, plans, rules] = await Promise.all([
		apiLoad<AcademyDisciplines>(event, '/api/academy/disciplines'),
		apiLoad<Plan[]>(event, '/api/academy/plans'),
		apiLoad<BookingRules>(event, '/api/academy/booking-rules')
	]);
	return { disciplines, plans: plans.filter((p) => p.isActive), rules };
};
