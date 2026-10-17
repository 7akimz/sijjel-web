import type { RequestHandler } from './$types';
import { API_URL } from '$app/env/private';
import { buildUpstreamRequest, toClientResponse, unreachable } from '#lib/server/proxy.js';

const proxy: RequestHandler = async ({ request, url }) => {
	try {
		const upstream = await fetch(buildUpstreamRequest(request, API_URL, url.pathname, url.search));
		return toClientResponse(upstream);
	} catch {
		return unreachable();
	}
};

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
