import type { Handle } from '@sveltejs/kit/hooks';
import { sequence } from '@sveltejs/kit/hooks';
import type { Me, Membership } from '#lib/api/types.js';
import { defineCustomServerStrategy, getTextDirection } from '#lib/paraglide/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';
import { apiFetch } from '#lib/server/api.js';
import { resolveTenant } from '#lib/server/tenant.js';
import { accentStyle, accentVars } from '#lib/theme/accent.js';
import { THEME_COOKIE, themeAttr, themeFromCookie } from '#lib/theme/theme.js';

const ACADEMY_LOCALE_HEADER = 'x-sijjel-academy-locale';

defineCustomServerStrategy('custom-academy', {
	getLocale: (request) => request?.headers.get(ACADEMY_LOCALE_HEADER) ?? undefined
});

const isPassthrough = (pathname: string) => pathname.startsWith('/api/') || pathname === '/healthz';

async function loadJSON<T>(response: Promise<Response>): Promise<T | null> {
	try {
		const result = await response;
		return result.ok ? ((await result.json()) as T) : null;
	} catch {
		return null;
	}
}

const handleContext: Handle = async ({ event, resolve }) => {
	event.locals.theme = themeFromCookie(event.cookies.get(THEME_COOKIE));
	event.locals.user = null;
	event.locals.membership = null;
	if (isPassthrough(event.url.pathname)) {
		event.locals.tenant = { kind: 'platform' };
		return resolve(event);
	}

	const tenant = await resolveTenant(() => apiFetch(event, '/api/tenant'));
	event.locals.tenant = tenant;
	const known = tenant.kind === 'platform' || tenant.kind === 'academy';
	if (known && event.cookies.get('sijjel_session')) {
		event.locals.user = await loadJSON<Me>(apiFetch(event, '/api/me'));
		if (event.locals.user && tenant.kind === 'academy') {
			event.locals.membership = await loadJSON<Membership>(apiFetch(event, '/api/membership'));
		}
	}
	return resolve(event);
};

const handlePage: Handle = ({ event, resolve }) => {
	if (isPassthrough(event.url.pathname)) return resolve(event);

	const tenant = event.locals.tenant;
	const headers = new Headers(event.request.headers);
	if (tenant.kind === 'academy') headers.set(ACADEMY_LOCALE_HEADER, tenant.academy.defaultLanguage);
	const request = new Request(event.request, { headers, duplex: 'half' } as RequestInit);
	const accent =
		tenant.kind === 'academy' ? accentStyle(accentVars(tenant.academy.primaryColor)) : '';

	return paraglideMiddleware(request, ({ request, locale }) => {
		event.locals.locale = locale;
		return resolve(
			{ ...event, request },
			{
				transformPageChunk: ({ html }) =>
					html
						.replace('%paraglide.lang%', locale)
						.replace('%paraglide.dir%', getTextDirection(locale))
						.replace('%sijjel.theme%', themeAttr(event.locals.theme))
						.replace('%sijjel.accent%', accent)
			}
		);
	});
};

export const handle: Handle = sequence(handleContext, handlePage);
