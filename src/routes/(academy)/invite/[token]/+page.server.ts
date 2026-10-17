import { error } from '@sveltejs/kit';
import type { InvitePreview } from '#lib/api/types.js';
import { apiFetch } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	let response: Response;
	try {
		response = await apiFetch(event, `/api/invites/${encodeURIComponent(event.params.token)}`);
	} catch {
		error(503, 'server_unreachable');
	}
	if (response.status === 404 || response.status === 409) error(404, 'invite_invalid');
	if (!response.ok) error(response.status, 'api_error');
	return { preview: (await response.json()) as InvitePreview };
};
