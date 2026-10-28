import type { Branding } from '#lib/api/branding-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => ({
	branding: await apiLoad<Branding>(event, '/api/academy/branding')
});
