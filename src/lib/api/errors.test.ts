import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './client';
import { ApiError, errorText } from './errors';

const problem = (status: number, body: object) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/problem+json' }
	});

afterEach(() => vi.unstubAllGlobals());

describe('api', () => {
	it('throws the problem code and field errors on a 400', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () =>
				problem(400, {
					status: 400,
					code: 'validation_failed',
					errors: { slug: ['slug_invalid'] }
				})
			)
		);

		const error = await api('/platform/academies', { method: 'POST', body: {} }).catch((e) => e);

		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({
			status: 400,
			code: 'validation_failed',
			fields: { slug: ['slug_invalid'] }
		});
	});

	it('reports server_unreachable when the network fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				throw new TypeError('Failed to fetch');
			})
		);

		const error = await api('/me').catch((e) => e);

		expect(error).toMatchObject({ status: 0, code: 'server_unreachable', fields: {} });
	});

	it('reports internal_error when the body is not a problem', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('<html>bad gateway</html>', { status: 502 }))
		);

		const error = await api('/me').catch((e) => e);

		expect(error).toMatchObject({ status: 502, code: 'internal_error' });
	});

	it('sends JSON to the same-origin API and returns the parsed body', async () => {
		const fetch = vi.fn(async () => Response.json({ id: 'a1' }, { status: 201 }));
		vi.stubGlobal('fetch', fetch);

		const created = await api<{ id: string }>('/platform/academies', {
			method: 'POST',
			body: { slug: 'alfaris' }
		});

		expect(created).toEqual({ id: 'a1' });
		expect(fetch).toHaveBeenCalledWith('/api/platform/academies', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: '{"slug":"alfaris"}'
		});
	});

	it('returns undefined for 204 responses', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(null, { status: 204 }))
		);

		expect(await api('/auth/logout', { method: 'POST' })).toBeUndefined();
	});
});

describe('errorText', () => {
	it('translates a known code', () => {
		expect(errorText('slug_taken', 'en')).toBe('Another academy already uses this address.');
	});

	it('falls back to the generic error for unknown codes', () => {
		expect(errorText('no_such_code', 'en')).toBe(
			'Something went wrong on our side. Try again in a moment.'
		);
	});
});
