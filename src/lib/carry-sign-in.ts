import { api } from '#lib/api/client.js';
import { platformSignInLocation } from '#lib/cross-host.js';

// carrySignIn sends a browser that just signed in on an academy through the platform host, so the
// main address knows them too, and back to returnTo. It reports false when it can't, and the
// caller carries on as before on the academy alone.
export async function carrySignIn(slug: string, returnTo: string): Promise<boolean> {
	let token: string;
	try {
		({ token } = await api<{ token: string }>('/me/platform-sign-in-link', {
			method: 'POST',
			body: {}
		}));
	} catch {
		return false;
	}
	const location = platformSignInLocation(window.location.host, slug, token, returnTo);
	if (!location) return false;
	window.location.assign(location);
	return true;
}
