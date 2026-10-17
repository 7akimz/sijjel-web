import type { Handle } from '@sveltejs/kit/hooks';
import { sequence } from '@sveltejs/kit/hooks';
import {
	cookieName as LOCALE_COOKIE,
	defineCustomServerStrategy,
	getTextDirection,
	isLocale
} from '#lib/paraglide/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';
import { apiFetch } from '#lib/server/api.js';
import { finishResponse, loadContext } from '#lib/server/context.js';
import { accentStyle, accentVars } from '#lib/theme/accent.js';
import { THEME_COOKIE, themeAttr, themeFromCookie } from '#lib/theme/theme.js';

const ACADEMY_LOCALE_HEADER = 'x-sijjel-academy-locale';

defineCustomServerStrategy('custom-academy', {
	getLocale: (request) => request?.headers.get(ACADEMY_LOCALE_HEADER) ?? undefined
});

const PASSTHROUGH = new Set(['/healthz', '/theme']);
const isPassthrough = (pathname: string) =>
	pathname.startsWith('/api/') || PASSTHROUGH.has(pathname);

const handleContext: Handle = async ({ event, resolve }) => {
	event.locals.theme = themeFromCookie(event.cookies.get(THEME_COOKIE));
	event.locals.user = null;
	event.locals.membership = null;
	if (isPassthrough(event.url.pathname)) {
		event.locals.tenant = { kind: 'platform' };
		return resolve(event);
	}

	const signedIn = !!event.cookies.get('sijjel_session');
	const context = await loadContext((path) => apiFetch(event, path), signedIn);
	event.locals.tenant = context.tenant;
	event.locals.user = context.user;
	event.locals.membership = context.membership;
	return finishResponse(await resolve(event), context.tenant, context.setCookies);
};

const handlePage: Handle = ({ event, resolve }) => {
	if (isPassthrough(event.url.pathname)) return resolve(event);

	const tenant = event.locals.tenant;
	const headers = new Headers(event.request.headers);
	// Paraglide runs custom server strategies before the cookie one, so the academy default
	// is only offered when the visitor hasn't chosen a language.
	const chosen = isLocale(event.cookies.get(LOCALE_COOKIE));
	if (tenant.kind === 'academy' && !chosen) {
		headers.set(ACADEMY_LOCALE_HEADER, tenant.academy.defaultLanguage);
	}
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
