import { describe, expect, it } from 'vitest';
import { resolveTenant } from './tenant';

const respond = (status: number, body: unknown) => async () =>
	new Response(JSON.stringify(body), { status });

describe('resolveTenant', () => {
	it('recognises the platform', async () => {
		expect(await resolveTenant(respond(200, { kind: 'platform', academy: null }))).toEqual({
			kind: 'platform'
		});
	});

	it('returns the academy branding', async () => {
		const academy = {
			slug: 'alfaris',
			nameEn: 'Al Faris',
			nameAr: 'الفارس',
			defaultLanguage: 'ar',
			primaryColor: '#1E6B52',
			disciplines: []
		};

		expect(await resolveTenant(respond(200, { kind: 'academy', academy }))).toEqual({
			kind: 'academy',
			academy
		});
	});

	it('treats 404 as an unknown academy', async () => {
		expect(await resolveTenant(respond(404, { code: 'academy_not_found' }))).toEqual({
			kind: 'unknown'
		});
	});

	it('treats network errors and 5xx as unavailable', async () => {
		expect(
			await resolveTenant(async () => {
				throw new TypeError('fetch failed');
			})
		).toEqual({ kind: 'unavailable' });
		expect(await resolveTenant(respond(502, {}))).toEqual({ kind: 'unavailable' });
	});
});
