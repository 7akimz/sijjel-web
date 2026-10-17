import { ApiError, apiErrorFrom } from './errors';

type ApiOptions = { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown };

export async function api<T = void>(path: string, { method = 'GET', body }: ApiOptions = {}) {
	const init: RequestInit = { method };
	if (body !== undefined) {
		init.headers = { 'content-type': 'application/json' };
		init.body = JSON.stringify(body);
	}

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
