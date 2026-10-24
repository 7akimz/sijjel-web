import type { RequestEvent } from '@sveltejs/kit';
import type { SetupState } from '#lib/api/academy-types.js';
import { apiLoad } from '#lib/server/api.js';

export function loadSetupFlow(event: RequestEvent): Promise<SetupState | null> {
	return event.url.searchParams.has('setup')
		? apiLoad<SetupState>(event, '/api/academy/setup')
		: Promise.resolve(null);
}
