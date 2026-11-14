import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url, data }) => {
	const { user } = await parent();
	if (!user) redirect(303, `/login?${new URLSearchParams({ returnTo: '/account' })}`);
	return { ...data, user, addPhone: url.searchParams.has('add_phone') };
};
