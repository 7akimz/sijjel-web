import { json } from '@sveltejs/kit';
import { webManifest } from '#lib/forms/manifest.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ locals }) =>
	json(webManifest(locals.tenant, locals.locale ?? 'en'), {
		headers: { 'content-type': 'application/manifest+json', 'cache-control': 'no-cache' }
	});
