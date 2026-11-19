const SLUG = /^[a-z0-9-]{1,63}$/;

// Each host keeps its own session cookie, so signing out on an academy also passes through the
// platform host to end the sign-in there. The location has no scheme, so the browser keeps its own.
export function platformSignOutLocation(host: string, slug: string): string | null {
	const prefix = `${slug}.`;
	if (!host.startsWith(prefix) || host.length === prefix.length) return null;
	return `//${host.slice(prefix.length)}/sign-out?academy=${encodeURIComponent(slug)}`;
}

// After signing out on the platform host, the browser goes back to the academy it came from.
export function academyLoginLocation(host: string, slug: string | null): string {
	if (!slug || !SLUG.test(slug)) return '/login';
	return `//${slug}.${host}/login`;
}
