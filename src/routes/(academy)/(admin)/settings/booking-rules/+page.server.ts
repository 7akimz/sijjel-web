import { error } from '@sveltejs/kit';
import type { BookingRules } from '#lib/api/academy-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const rules = await apiLoad<BookingRules>(event, '/api/academy/booking-rules');
	// Where staff book, no rider rule applies, so the page doesn't exist.
	if (!rules.ridersBook) error(404, 'not_found');
	return { rules };
};
