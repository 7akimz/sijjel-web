import { isAcademyAdmin } from '#lib/academy/admin.js';
import type { SetupState } from '#lib/api/academy-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { locals } = event;
	const admin = locals.tenant.kind === 'academy' && isAcademyAdmin(locals.membership);
	return { setup: admin ? await apiLoad<SetupState>(event, '/api/academy/setup') : null };
};
