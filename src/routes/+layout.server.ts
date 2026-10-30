import { redirect } from '@sveltejs/kit';
import { needsPhone } from '#lib/account.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	// Reading the path reruns this load on every navigation, so the membership (setup progress included) never goes stale.
	if (needsPhone(locals.user, url.pathname)) redirect(303, '/account?add_phone=1');
	return {
		tenant: locals.tenant,
		user: locals.user,
		membership: locals.membership,
		locale: locals.locale,
		theme: locals.theme
	};
};
