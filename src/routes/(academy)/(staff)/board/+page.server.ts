import type { BoardSession } from '#lib/api/board-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const query = new URLSearchParams();
	for (const key of ['date', 'start']) {
		const value = event.url.searchParams.get(key);
		if (value) query.set(key, value);
	}
	const session = await apiLoad<BoardSession>(event, `/api/board?${query}`);
	return { session };
};
