import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({
	tenant: locals.tenant,
	user: locals.user,
	membership: locals.membership,
	locale: locals.locale,
	theme: locals.theme
});
