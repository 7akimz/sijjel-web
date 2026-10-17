const PROBE_ORIGIN = 'http://return-to.invalid';

// safeReturnTo keeps post-sign-in redirects on this site; anything else goes home. Parsing as
// a URL catches tricks like tabs inside "/\t/evil.test", which browsers read as "//evil.test".
export function safeReturnTo(value: string | null | undefined): string {
	if (!value?.startsWith('/')) return '/';
	let url: URL;
	try {
		url = new URL(value, PROBE_ORIGIN);
	} catch {
		return '/';
	}
	if (url.origin !== PROBE_ORIGIN) return '/';
	return url.pathname + url.search + url.hash;
}
