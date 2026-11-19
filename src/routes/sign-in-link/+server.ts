import { error, type RequestEvent } from '@sveltejs/kit';
import { apiFetch } from '#lib/server/api.js';
import { academyContinueLocation } from '#lib/cross-host.js';
import type { RequestHandler } from './$types';

const noStore = () =>
	new Headers({ 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });

function spend(event: RequestEvent): Promise<Response> {
	return apiFetch(event, '/api/auth/sign-in-link', {
		method: 'POST',
		headers: { origin: event.url.origin, 'content-type': 'application/json' },
		body: JSON.stringify({ token: event.url.searchParams.get('token') ?? '' })
	});
}

// Spends a sign-in link made on the other host. On an academy it lands on the academy's home,
// signed in; a used or expired link falls back to the academy's sign-in page. On the platform
// host it goes back to the academy the link came from, signed in or not.
export const GET: RequestHandler = async (event) => {
	const { tenant } = event.locals;
	if (tenant.kind === 'platform') {
		const response = await spend(event);
		const headers = noStore();
		for (const cookie of response.headers.getSetCookie()) headers.append('set-cookie', cookie);
		const params = event.url.searchParams;
		headers.set(
			'location',
			academyContinueLocation(event.url.host, params.get('academy'), params.get('returnTo'))
		);
		return new Response(null, { status: 303, headers });
	}
	if (tenant.kind !== 'academy') error(404, 'not_found');
	const response = await spend(event);
	const headers = noStore();
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
