import { error } from '@sveltejs/kit';
import type { AcademyDisciplines } from '#lib/api/academy-types.js';
import type { Member, Plan } from '#lib/api/member-types.js';
import { isStaffOnly } from '#lib/forms/member.js';
import { apiLoad } from '#lib/server/api.js';
import { academyToday } from '#lib/server/today.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { tenant } = event.locals;
	if (tenant.kind !== 'academy') error(404, 'academy_not_found');
	const id = encodeURIComponent(event.params.id);
	const [member, disciplines, plans] = await Promise.all([
		apiLoad<Member>(event, `/api/academy/members/${id}`),
		apiLoad<AcademyDisciplines>(event, '/api/academy/disciplines'),
		apiLoad<Plan[]>(event, '/api/academy/plans')
	]);
	return {
		member,
		navPath: isStaffOnly(member) ? '/settings/staff' : undefined,
		disciplines,
		plans,
		today: academyToday(tenant.academy.timeZone)
	};
};
