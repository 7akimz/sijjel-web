import { redirect } from '@sveltejs/kit';
import type { Member } from '#lib/api/member-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const member = await apiLoad<Member>(
		event,
		`/api/academy/members/${encodeURIComponent(event.params.id)}`
	);
	if (!member.roles.includes('admin') && !member.roles.includes('trainer')) {
		redirect(307, `/members/${encodeURIComponent(member.id)}`);
	}
	return { member };
};
