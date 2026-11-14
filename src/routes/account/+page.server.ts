import { isAcademyRider } from '#lib/academy/rider.js';
import { pushKey } from '#lib/server/push-key.js';
import type { PageServerLoad } from './$types';

// Riders turn on cancellation notices here; staff do it on the reminders page.
export const load: PageServerLoad = async (event) => {
	const { tenant, membership } = event.locals;
	const rider = tenant.kind === 'academy' && isAcademyRider(membership);
	return { publicKey: rider ? await pushKey(event) : null };
};
