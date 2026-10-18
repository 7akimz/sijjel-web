import type { BookingRules } from '#lib/api/academy-types.js';
import { apiLoad } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => ({
	rules: await apiLoad<BookingRules>(event, '/api/academy/booking-rules')
});
