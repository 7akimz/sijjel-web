import { describe, expect, it } from 'vitest';
import { buildUpstreamRequest, toClientResponse } from './proxy';

describe('buildUpstreamRequest', () => {
	it('targets the API, forwards the browser host and keeps the session cookie', () => {
		const incoming = new Request('http://alfaris.localhost:5173/api/tenant?x=1', {
			headers: {
				host: 'alfaris.localhost:5173',
				cookie: 'sijjel_session=abc',
				origin: 'http://alfaris.localhost:5173',
				connection: 'keep-alive',
				accept: 'application/json'
			}
		});

		const upstream = buildUpstreamRequest(incoming, 'http://localhost:8080', '/api/tenant', '?x=1');

		expect(upstream.url).toBe('http://localhost:8080/api/tenant?x=1');
		expect(upstream.headers.get('x-forwarded-host')).toBe('alfaris.localhost:5173');
		expect(upstream.headers.get('cookie')).toBe('sijjel_session=abc');
		expect(upstream.headers.get('origin')).toBe('http://alfaris.localhost:5173');
		expect(upstream.headers.get('connection')).toBeNull();
		expect(upstream.headers.get('host')).toBeNull();
	});

	it('streams the body of unsafe methods', async () => {
		const incoming = new Request('http://localhost:5173/api/auth/login', {
			method: 'POST',
			headers: { host: 'localhost:5173', 'content-type': 'application/json' },
			body: '{"email":"a@b.c"}'
		});

		const upstream = buildUpstreamRequest(incoming, 'http://localhost:8080', '/api/auth/login', '');

		expect(upstream.method).toBe('POST');
		expect(upstream.headers.get('content-type')).toBe('application/json');
		expect(await upstream.text()).toBe('{"email":"a@b.c"}');
	});
});

describe('toClientResponse', () => {
	it('keeps the status, body and every set-cookie header', async () => {
		const headers = new Headers({ 'content-type': 'application/problem+json' });
		headers.append('set-cookie', 'a=1; Path=/');
		headers.append('set-cookie', 'b=2; Path=/');
		const upstream = new Response('{"code":"x"}', { status: 409, headers });

		const response = toClientResponse(upstream);

		expect(response.status).toBe(409);
		expect(response.headers.getSetCookie()).toEqual(['a=1; Path=/', 'b=2; Path=/']);
		expect(response.headers.get('content-type')).toBe('application/problem+json');
		expect(await response.text()).toBe('{"code":"x"}');
	});
});
