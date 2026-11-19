import { error } from '@sveltejs/kit';
import { apiFetch } from '#lib/server/api.js';
import { academyHomeLocation } from '#lib/cross-host.js';
import type { RequestHandler } from './$types';

// Ends the platform host's sign-in for a browser that just signed out on one of its academies,
// then sends it back to that academy's home. It is a plain link because a form posted
// from the academy host is cross-origin; at worst another site can sign someone out.
export const GET: RequestHandler = async (event) => {
	if (event.locals.tenant.kind !== 'platform') error(404, 'not_found');
	const headers = new Headers({ 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
	if (event.request.headers.get('cookie')) {
		const response = await apiFetch(event, '/api/auth/logout', {
			method: 'POST',
			headers: { origin: event.url.origin, 'content-type': 'application/json' },
			body: '{}'
		});
		for (const cookie of response.headers.getSetCookie()) headers.append('set-cookie', cookie);
	}
	headers.set(
		'location',
		academyHomeLocation(event.url.host, event.url.searchParams.get('academy'))
	);
	return new Response(null, { status: 303, headers });
};
