import type { AcademyDisciplines } from '#lib/api/academy-types.js';
import type { Plan } from '#lib/api/member-types.js';
import type { AcademySubscription } from '#lib/api/subscription-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const [disciplines, plans, subscription] = await Promise.all([
		apiLoad<AcademyDisciplines>(event, '/api/academy/disciplines'),
		apiLoad<Plan[]>(event, '/api/academy/plans'),
		apiLoad<AcademySubscription>(event, '/api/academy/subscription')
	]);
	return {
		disciplines,
		plans: plans.filter((p) => p.isActive),
		riders: subscription.riders
	};
};
