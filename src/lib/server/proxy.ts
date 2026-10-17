const FORWARDED_REQUEST_HEADERS = ['cookie', 'content-type', 'origin', 'accept', 'accept-language'];
const RETURNED_RESPONSE_HEADERS = [
	'content-type',
	'cache-control',
	'etag',
	'last-modified',
	'location'
];

export function buildUpstreamRequest(
	request: Request,
	apiUrl: string,
	path: string,
	search: string
): Request {
	const headers = new Headers();
	for (const name of FORWARDED_REQUEST_HEADERS) {
		const value = request.headers.get(name);
		if (value !== null) headers.set(name, value);
	}
	const host = request.headers.get('host') ?? new URL(request.url).host;
	headers.set('x-forwarded-host', host);

	const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
	return new Request(new URL(path + search, apiUrl), {
		method: request.method,
		headers,
		body: hasBody ? request.body : undefined,
		redirect: 'manual',
		...(hasBody ? { duplex: 'half' } : {})
	} as RequestInit);
}

export function toClientResponse(upstream: Response): Response {
	const headers = new Headers();
	for (const name of RETURNED_RESPONSE_HEADERS) {
		const value = upstream.headers.get(name);
		if (value !== null) headers.set(name, value);
	}
	for (const cookie of upstream.headers.getSetCookie()) {
		headers.append('set-cookie', cookie);
	}
	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers
	});
}

export function unreachable(): Response {
	return new Response(
		JSON.stringify({
			type: 'about:blank',
			title: 'server_unreachable',
			status: 503,
			code: 'server_unreachable'
		}),
		{ status: 503, headers: { 'content-type': 'application/problem+json' } }
	);
}
