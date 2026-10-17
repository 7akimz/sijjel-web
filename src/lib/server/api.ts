import type { RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { API_URL } from '$app/env/private';

// apiFetch calls sijjel-api from the server on behalf of the browser request, so the API
// sees the same academy host and session cookie the browser sent.
export function apiFetch(
	event: RequestEvent,
	path: string,
	init: RequestInit = {}
): Promise<Response> {
	const headers = new Headers(init.headers);
	headers.set('x-forwarded-host', event.request.headers.get('host') ?? event.url.host);
	const cookie = event.request.headers.get('cookie');
	if (cookie) headers.set('cookie', cookie);
	headers.set('accept', 'application/json');
	return fetch(new URL(path, API_URL), { ...init, headers });
}

// apiLoad reads JSON for a page load and turns API failures into the matching error page.
export async function apiLoad<T>(event: RequestEvent, path: string): Promise<T> {
	let response: Response;
	try {
		response = await apiFetch(event, path);
	} catch {
		error(503, 'server_unreachable');
	}
	if (!response.ok) error(response.status, 'api_error');
	return (await response.json()) as T;
}
