import { error, redirect } from '@sveltejs/kit';
import { apiFetch } from '#lib/server/api.js';
import { signInLinkLocation } from '#lib/server/sign-in-link.js';
import type { RequestHandler } from './$types';

const SLUG = /^[a-z0-9-]{1,63}$/;

// Opening an academy from the platform host carries the session over with a one-time sign-in
// link, since each academy host keeps its own session cookie.
export const GET: RequestHandler = async (event) => {
	const { locals, params, url } = event;
	if (locals.tenant.kind !== 'platform' || !SLUG.test(params.slug)) error(404, 'not_found');
	if (!locals.user) redirect(303, '/login');
	const response = await apiFetch(event, `/api/me/academies/${params.slug}/sign-in-link`, {
		method: 'POST',
		headers: { origin: url.origin }
	});
	if (!response.ok) error(response.status, 'api_error');
	const { token } = (await response.json()) as { token: string };
	return new Response(null, {
		status: 303,
		headers: {
			location: signInLinkLocation(params.slug, url.host, token),
			'cache-control': 'no-store'
		}
	});
};
