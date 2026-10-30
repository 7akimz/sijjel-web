import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
	const { user } = await parent();
	if (!user) redirect(303, `/login?${new URLSearchParams({ returnTo: '/account' })}`);
	return { user, addPhone: url.searchParams.has('add_phone') };
};
