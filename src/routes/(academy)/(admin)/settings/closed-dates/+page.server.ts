import type { ClosedRange, Schedule } from '#lib/api/academy-types.js';
import { apiLoad } from '#lib/server/api.js';
import { academyToday } from '#lib/server/today.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const [closures, schedule] = await Promise.all([
		apiLoad<ClosedRange[]>(event, '/api/academy/closed-dates'),
		apiLoad<Schedule>(event, '/api/academy/schedule')
	]);
	return {
		closures,
		today: academyToday(schedule.timeZone),
		bookUrl: new URL('/book', event.url.origin).href
	};
};
