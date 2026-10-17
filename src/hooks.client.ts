import { defineCustomClientStrategy } from '#lib/paraglide/runtime.js';

// The academy's default language reaches the browser as the server-rendered <html lang>;
// a visitor's own choice is stored by the cookie strategy, so nothing is persisted here.
defineCustomClientStrategy('custom-academy', {
	getLocale: () => document.documentElement.lang || undefined,
	setLocale: () => {}
});
