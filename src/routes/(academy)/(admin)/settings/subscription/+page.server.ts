import type { AcademySubscription } from '#lib/api/subscription-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => ({
	subscription: await apiLoad<AcademySubscription>(event, '/api/academy/subscription')
});
