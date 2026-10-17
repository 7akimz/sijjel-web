import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	API_URL: {
		description: 'Base URL of sijjel-api, reachable from this server (never exposed to browsers).',
		schema: (value) => value ?? 'http://localhost:8080'
	}
});
