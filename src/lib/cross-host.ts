import { safeReturnTo } from '#lib/navigation.js';

// Each host keeps its own session cookie, so one sign-in passes through the other host to cover
// both. Locations have no scheme, so the browser keeps the one it is on.

const SLUG = /^[a-z0-9-]{1,63}$/;

function platformHost(host: string, slug: string): string | null {
	const prefix = `${slug}.`;
	if (!host.startsWith(prefix) || host.length === prefix.length) return null;
	return host.slice(prefix.length);
}

// Signing out on an academy also ends the sign-in on the platform host.
export function platformSignOutLocation(host: string, slug: string): string | null {
	const platform = platformHost(host, slug);
	if (!platform) return null;
	return `//${platform}/sign-out?academy=${encodeURIComponent(slug)}`;
}

// After signing out on the platform host, the browser goes back to the home of the academy it
// came from.
export function academyHomeLocation(host: string, slug: string | null): string {
	if (!slug || !SLUG.test(slug)) return '/';
	return `//${slug}.${host}/`;
}

// Signing in on an academy also signs in on the platform host with a one-time link.
export function platformSignInLocation(
	host: string,
	slug: string,
	token: string,
	returnTo: string
): string | null {
	const platform = platformHost(host, slug);
	if (!platform) return null;
	const query = new URLSearchParams({ token, academy: slug, returnTo });
	return `//${platform}/sign-in-link?${query}`;
}

// After the platform host spends that link, the browser goes back to where it was going on the
// academy, through a page there so the academy's strict cookie is sent.
export function academyContinueLocation(
	host: string,
	slug: string | null,
	returnTo: string | null
): string {
	if (!slug || !SLUG.test(slug)) return '/';
	return `//${slug}.${host}/continue?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`;
}
