import { error } from '@sveltejs/kit';
import { safeReturnTo } from '#lib/navigation.js';
import type { RequestHandler } from './$types';

// The last step back from the platform host after signing in. The browser arrived through
// redirects from another host, so it may hold back the academy's strict session cookie; a page on
// the academy moving on by itself makes the next request same-site, and the cookie goes with it.
export const GET: RequestHandler = ({ locals, url }) => {
	if (locals.tenant.kind !== 'academy') error(404, 'not_found');
	const to = safeReturnTo(url.searchParams.get('returnTo'));
	const attribute = to.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
	return new Response(`<!doctype html><meta http-equiv="refresh" content="0;url=${attribute}">`, {
		status: 200,
		headers: {
			'content-type': 'text/html; charset=utf-8',
			'cache-control': 'no-store',
			'referrer-policy': 'no-referrer'
		}
	});
};
