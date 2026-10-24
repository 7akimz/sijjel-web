import type { Arena } from '#lib/api/academy-types.js';
import { apiLoad } from '#lib/server/api.js';
import { loadSetupFlow } from '#lib/server/setup.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const [arenas, setup] = await Promise.all([
		apiLoad<Arena[]>(event, '/api/academy/arenas'),
		loadSetupFlow(event)
	]);
	return { arenas, setup };
};
