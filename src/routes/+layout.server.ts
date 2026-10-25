import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	// Reading the path reruns this load on every navigation, so the membership (setup progress included) never goes stale.
	void url.pathname;
	return {
		tenant: locals.tenant,
		user: locals.user,
		membership: locals.membership,
		locale: locals.locale,
		theme: locals.theme
	};
};
