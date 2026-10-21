import type { Locale, Tenant } from '#lib/api/types.js';
import { accentVars } from '#lib/theme/accent.js';

const DEFAULT_ACCENT = '#7a5230';
const GROUND = '#f5f0e6';

export type WebManifest = {
	name: string;
	short_name: string;
	lang: Locale;
	dir: 'ltr' | 'rtl';
	start_url: string;
	scope: string;
	display: 'standalone';
	theme_color: string;
	background_color: string;
	icons: { src: string; sizes: string; type: string; purpose?: string }[];
};

// What a phone needs to install the site as an app: the academy's own name and colour, so a
// trainer's home screen shows the academy rather than sijjel.
export function webManifest(tenant: Tenant, locale: Locale): WebManifest {
	const academy = tenant.kind === 'academy' ? tenant.academy : null;
	const name = academy ? (locale === 'ar' ? academy.nameAr : academy.nameEn) : 'sijjel';
	return {
		name,
		short_name: name,
		lang: locale,
		dir: locale === 'ar' ? 'rtl' : 'ltr',
		start_url: '/',
		scope: '/',
		display: 'standalone',
		theme_color: (academy && accentVars(academy.primaryColor).light['--accent']) || DEFAULT_ACCENT,
		background_color: GROUND,
		icons: [
			{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
			{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
		]
	};
}
