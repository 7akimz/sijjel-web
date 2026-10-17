import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { tenant, user } = await parent();
	if (tenant.kind === 'platform' && user?.isPlatformAdmin) redirect(303, '/platform/academies');
};
