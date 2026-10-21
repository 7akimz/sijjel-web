import { error } from '@sveltejs/kit';
import { apiFetch } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	let response: Response;
	try {
		response = await apiFetch(event, '/api/push/key');
	} catch {
		error(503, 'server_unreachable');
	}
	if (response.status === 404) return { publicKey: null };
	if (!response.ok) error(response.status, 'api_error');
	const { publicKey } = (await response.json()) as { publicKey: string };
	return { publicKey };
};
