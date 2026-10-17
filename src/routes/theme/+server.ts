import { json } from '@sveltejs/kit';
import { THEME_COOKIE } from '#lib/theme/theme.js';
import type { RequestHandler } from './$types';

const ONE_YEAR = 60 * 60 * 24 * 365;

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = (await request.json().catch(() => null)) as { theme?: unknown } | null;
	const theme = body?.theme;
	if (theme !== 'light' && theme !== 'dark' && theme !== 'system') {
		return json({ code: 'validation_failed' }, { status: 400 });
	}
	cookies.set(THEME_COOKIE, theme, {
		path: '/',
		maxAge: ONE_YEAR,
		httpOnly: true,
		sameSite: 'lax',
		// A display preference, not a credential: keep it working on plain-http hosts too.
		secure: false
	});
	return new Response(null, { status: 204 });
};
