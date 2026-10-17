import { error, redirect } from '@sveltejs/kit';
import { safeReturnTo } from '#lib/navigation.js';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
	const { tenant, user } = await parent();
	if (tenant.kind !== 'platform' && tenant.kind !== 'academy') error(404, 'academy_not_found');
	const returnTo = safeReturnTo(url.searchParams.get('returnTo'));
	if (user) redirect(303, returnTo);
	return { returnTo };
};
