// signInLinkLocation is where the platform host sends someone opening an academy. It has no
// scheme, so the browser keeps the one it is on: the server can't tell http from https
// without a proxy header.
export function signInLinkLocation(slug: string, host: string, token: string): string {
	return `//${slug}.${host}/sign-in-link?token=${encodeURIComponent(token)}`;
}
