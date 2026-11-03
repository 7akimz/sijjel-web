import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, upload } from './client';
import { ApiError } from './errors';

afterEach(() => vi.unstubAllGlobals());

describe('api', () => {
	it('labels a write with no body as JSON, so it is never taken for a cross-site form', async () => {
		const fetch = vi.fn(async () => new Response(null, { status: 204 }));
		vi.stubGlobal('fetch', fetch);

		await api('/academy/members/1/payments/2026-11', { method: 'POST' });

		expect(fetch).toHaveBeenCalledWith('/api/academy/members/1/payments/2026-11', {
			method: 'POST',
			headers: { 'content-type': 'application/json' }
		});
	});

	it('sends a read with no content type', async () => {
		const fetch = vi.fn(async () => Response.json([]));
		vi.stubGlobal('fetch', fetch);

		await api('/academy/members');

		expect(fetch).toHaveBeenCalledWith('/api/academy/members', { method: 'GET' });
	});
});

describe('upload', () => {
	it('sends the blob as the body with its own content type', async () => {
		const fetch = vi.fn(async () => Response.json({ logoUrl: '/api/files/1' }));
		vi.stubGlobal('fetch', fetch);
		const blob = new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' });

		const result = await upload<{ logoUrl: string }>('/academy/branding/logo', blob);

		expect(result).toEqual({ logoUrl: '/api/files/1' });
		expect(fetch).toHaveBeenCalledWith('/api/academy/branding/logo', {
			method: 'PUT',
			headers: { 'content-type': 'image/png' },
			body: blob
		});
	});

	it('throws the problem code', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(
				async () =>
					new Response(JSON.stringify({ status: 413, code: 'image_too_large' }), {
						status: 413,
						headers: { 'content-type': 'application/problem+json' }
					})
			)
		);

		const error = await upload(
			'/academy/branding/cover',
			new Blob(['x'], { type: 'image/jpeg' })
		).catch((e) => e);

		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({ status: 413, code: 'image_too_large' });
	});
});
