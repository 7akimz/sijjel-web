import { error, redirect } from '@sveltejs/kit';
import { safeReturnTo } from '#lib/navigation.js';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
	const { tenant, user } = await parent();
	if (tenant.kind === 'unavailable') error(503, 'server_unreachable');
	if (tenant.kind === 'unknown') error(404, 'academy_not_found');
	const returnTo = safeReturnTo(url.searchParams.get('returnTo'));
	if (user) redirect(303, returnTo);
	const identifier = (url.searchParams.get('identifier') ?? '').trim().slice(0, 254);
	return { returnTo, identifier };
};
