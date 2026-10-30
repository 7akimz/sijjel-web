import type { Me } from '#lib/api/types.js';

const EXEMPT_PREFIXES = ['/login', '/api/', '/healthz', '/theme'];

/** Accounts made before phones were required add one before they go anywhere else. */
export function needsPhone(user: Me | null, pathname: string): boolean {
	if (!user || user.phone !== null) return false;
	if (pathname === '/account') return false;
	return !EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * A stored phone as people type it back: the API keeps international digits, and only a leading
 * "+" tells it they already include the country code.
 */
export const shownPhone = (digits: string | null | undefined) => (digits ? `+${digits}` : '');
