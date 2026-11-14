import { error, type RequestEvent } from '@sveltejs/kit';
import { apiFetch } from '#lib/server/api.js';

/** The server's Web Push key, or null when push is switched off there. */
export async function pushKey(event: RequestEvent): Promise<string | null> {
	let response: Response;
	try {
		response = await apiFetch(event, '/api/push/key');
	} catch {
		error(503, 'server_unreachable');
	}
	if (response.status === 404) return null;
	if (!response.ok) error(response.status, 'api_error');
	const { publicKey } = (await response.json()) as { publicKey: string };
	return publicKey;
}
