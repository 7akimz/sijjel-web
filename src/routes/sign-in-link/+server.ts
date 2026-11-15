import { error } from '@sveltejs/kit';
import { apiFetch } from '#lib/server/api.js';
import type { RequestHandler } from './$types';

// Spends a sign-in link from the platform host and lands on the academy's home, signed in.
// A used or expired link falls back to the academy's sign-in page.
export const GET: RequestHandler = async (event) => {
	if (event.locals.tenant.kind !== 'academy') error(404, 'not_found');
	const response = await apiFetch(event, '/api/auth/sign-in-link', {
		method: 'POST',
		headers: { origin: event.url.origin, 'content-type': 'application/json' },
		body: JSON.stringify({ token: event.url.searchParams.get('token') ?? '' })
	});
	const headers = new Headers({ 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
	if (!response.ok) {
		headers.set('location', '/login');
		return new Response(null, { status: 303, headers });
	}
	for (const cookie of response.headers.getSetCookie()) headers.append('set-cookie', cookie);
	// The browser sends the strict session cookie only on a same-site navigation, and this
	// request arrived through redirects from the platform host, so the academy page itself
	// moves on to the home.
	headers.set('content-type', 'text/html; charset=utf-8');
	return new Response('<!doctype html><meta http-equiv="refresh" content="0;url=/">', {
		status: 200,
		headers
	});
};
