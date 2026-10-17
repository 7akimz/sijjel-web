import type { Me, Membership, Tenant } from '#lib/api/types.js';
import { resolveTenant } from './tenant';

export interface RequestContext {
	tenant: Tenant;
	user: Me | null;
	membership: Membership | null;
	// Session renewals the API issued while serving SSR calls, to pass on to the browser.
	setCookies: string[];
}

async function readJSON<T>(response: Promise<Response>): Promise<T | null> {
	try {
		const result = await response;
		return result.ok ? ((await result.json()) as T) : null;
	} catch {
		return null;
	}
}

export async function loadContext(
	call: (path: string) => Promise<Response>,
	signedIn: boolean
): Promise<RequestContext> {
	const setCookies: string[] = [];
	const tracked = async (path: string) => {
		const response = await call(path);
		setCookies.push(...response.headers.getSetCookie());
		return response;
	};

	const [tenant, me] = await Promise.all([
		resolveTenant(() => tracked('/api/tenant')),
		signedIn ? readJSON<Me>(tracked('/api/me')) : null
	]);
	const known = tenant.kind === 'platform' || tenant.kind === 'academy';
	const user = known ? me : null;
	const membership =
		user && tenant.kind === 'academy'
			? await readJSON<Membership>(tracked('/api/membership'))
			: null;
	return { tenant, user, membership, setCookies };
}

const TENANT_STATUS: Partial<Record<Tenant['kind'], number>> = { unknown: 404, unavailable: 503 };

export function finishResponse(response: Response, tenant: Tenant, setCookies: string[]): Response {
	const tenantStatus = TENANT_STATUS[tenant.kind];
	const isPage = response.headers.get('content-type')?.startsWith('text/html');
	const status = tenantStatus && isPage && response.status === 200 ? tenantStatus : response.status;
	if (status === response.status && setCookies.length === 0) return response;

	const headers = new Headers(response.headers);
	for (const cookie of setCookies) headers.append('set-cookie', cookie);
	return new Response(response.body, { status, statusText: '', headers });
}
