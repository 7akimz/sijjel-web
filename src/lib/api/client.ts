import { ApiError, apiErrorFrom } from './errors';

type ApiOptions = { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown };

async function send<T>(path: string, init: RequestInit) {
	let response: Response;
	try {
		response = await fetch(`/api${path}`, init);
	} catch {
		throw new ApiError(0, 'server_unreachable');
	}
	if (!response.ok) throw await apiErrorFrom(response);
	if (response.status === 204) return undefined as T;
	return (await response.json()) as T;
}

export async function api<T = void>(path: string, { method = 'GET', body }: ApiOptions = {}) {
	const init: RequestInit = { method };
	// SvelteKit treats a write with no content type as a form post and refuses it when the
	// origin it assumes differs, so every write says JSON even when it carries no body.
	if (method !== 'GET') init.headers = { 'content-type': 'application/json' };
	if (body !== undefined) init.body = JSON.stringify(body);
	return send<T>(path, init);
}

/** Sends a file as the raw request body, typed by the blob's own content type. */
export async function upload<T = void>(path: string, blob: Blob, method: 'PUT' = 'PUT') {
	return send<T>(path, { method, headers: { 'content-type': blob.type }, body: blob });
}
