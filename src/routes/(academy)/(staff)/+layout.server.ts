import { error, redirect } from '@sveltejs/kit';
import { isAcademyStaff } from '#lib/academy/staff.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url, parent }) => {
	await parent();
	if (!locals.user)
		redirect(303, `/login?returnTo=${encodeURIComponent(url.pathname + url.search)}`);
	if (!isAcademyStaff(locals.membership)) error(403, 'not_staff');
};
