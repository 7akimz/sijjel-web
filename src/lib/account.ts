import type { Me } from '#lib/api/types.js';

const EXEMPT_PREFIXES = ['/login', '/api/', '/healthz', '/theme'];

/** Accounts made before phones were required add one before they go anywhere else. */
export function needsPhone(user: Me | null, pathname: string): boolean {
	if (!user || user.phone !== null) return false;
	if (pathname === '/account') return false;
	return !EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
