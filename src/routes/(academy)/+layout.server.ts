import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	if (locals.tenant.kind === 'unavailable') error(503, 'server_unreachable');
	if (locals.tenant.kind !== 'academy') error(404, 'not_found');
};
