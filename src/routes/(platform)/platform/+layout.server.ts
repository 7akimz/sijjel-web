import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	if (locals.tenant.kind !== 'platform') error(404, 'not_found');
	if (!locals.user) redirect(303, `/login?returnTo=${encodeURIComponent(url.pathname)}`);
	if (!locals.user.isPlatformAdmin) error(403, 'forbidden');
};
