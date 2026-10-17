import { describe, expect, it } from 'vitest';
import { finishResponse, loadContext } from './context';

const academy = {
	slug: 'alfaris',
	nameEn: 'Al Faris',
	nameAr: 'الفارس',
	defaultLanguage: 'ar',
	primaryColor: '#1E6B52',
	disciplines: []
};
const me = {
	id: 'u1',
	email: 'a@b.test',
	displayName: 'A',
	preferredLanguage: null,
	isPlatformAdmin: false
};
const membership = { roles: ['rider'], status: 'active', discipline: null, level: null };

function fakeApi(routes: Record<string, Response | (() => Response)>) {
	const calls: string[] = [];
	const call = async (path: string) => {
		calls.push(path);
		const route = routes[path];
		if (!route) throw new TypeError('fetch failed');
		return typeof route === 'function' ? route() : route.clone();
	};
	return { call, calls };
}

const renewed = (body: unknown) =>
	new Response(JSON.stringify(body), {
		headers: { 'set-cookie': 'sijjel_session=new; Path=/; HttpOnly' }
	});

describe('loadContext', () => {
	it('loads the member of an academy and keeps the session renewal', async () => {
		const api = fakeApi({
			'/api/tenant': Response.json({ kind: 'academy', academy }),
			'/api/me': () => renewed(me),
			'/api/membership': Response.json(membership)
		});

		const context = await loadContext(api.call, true);

		expect(context.tenant).toEqual({ kind: 'academy', academy });
		expect(context.user).toEqual(me);
		expect(context.membership).toEqual(membership);
		expect(context.setCookies).toEqual(['sijjel_session=new; Path=/; HttpOnly']);
	});

	it('skips the user lookups for signed-out visitors', async () => {
		const api = fakeApi({ '/api/tenant': Response.json({ kind: 'platform', academy: null }) });

		const context = await loadContext(api.call, false);

		expect(context).toEqual({
			tenant: { kind: 'platform' },
			user: null,
			membership: null,
			setCookies: []
		});
		expect(api.calls).toEqual(['/api/tenant']);
	});

	it('does not ask for a membership on the platform site', async () => {
		const api = fakeApi({
			'/api/tenant': Response.json({ kind: 'platform', academy: null }),
			'/api/me': Response.json(me)
		});

		const context = await loadContext(api.call, true);

		expect(context.user).toEqual(me);
		expect(api.calls).not.toContain('/api/membership');
	});

	it('reports an unreachable API as unavailable with nobody signed in', async () => {
		const api = fakeApi({});

		const context = await loadContext(api.call, true);

		expect(context.tenant).toEqual({ kind: 'unavailable' });
		expect(context.user).toBeNull();
	});

	it('treats an unknown academy as signed out', async () => {
		const api = fakeApi({
			'/api/tenant': Response.json({ code: 'academy_not_found' }, { status: 404 }),
			'/api/me': Response.json(me)
		});

		const context = await loadContext(api.call, true);

		expect(context.tenant).toEqual({ kind: 'unknown' });
		expect(context.user).toBeNull();
	});
});

describe('finishResponse', () => {
	const page = () => new Response('<html></html>', { headers: { 'content-type': 'text/html' } });

	it('turns a rendered page into 404 for an unknown academy and 503 when the API is down', () => {
		expect(finishResponse(page(), { kind: 'unknown' }, []).status).toBe(404);
		expect(finishResponse(page(), { kind: 'unavailable' }, []).status).toBe(503);
		expect(finishResponse(page(), { kind: 'platform' }, []).status).toBe(200);
	});

	it('leaves non-page responses and error statuses alone', () => {
		const data = Response.json({});
		expect(finishResponse(data, { kind: 'unavailable' }, [])).toBe(data);
		const failed = new Response('', { status: 500, headers: { 'content-type': 'text/html' } });
		expect(finishResponse(failed, { kind: 'unknown' }, []).status).toBe(500);
	});

	it('passes session renewals on to the browser', () => {
		const response = finishResponse(page(), { kind: 'platform' }, ['sijjel_session=new; Path=/']);

		expect(response.headers.getSetCookie()).toEqual(['sijjel_session=new; Path=/']);
		expect(response.headers.get('content-type')).toBe('text/html');
	});
});
