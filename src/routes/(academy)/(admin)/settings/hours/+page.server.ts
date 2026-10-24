import type { Schedule } from '#lib/api/academy-types.js';
import { apiLoad } from '#lib/server/api.js';
import { loadSetupFlow } from '#lib/server/setup.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const [schedule, setup] = await Promise.all([
		apiLoad<Schedule>(event, '/api/academy/schedule'),
		loadSetupFlow(event)
	]);
	return { schedule, setup };
};
