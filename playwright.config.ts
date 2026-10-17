import { defineConfig } from '@playwright/test';
import { API_PORT, PORT } from './e2e/config';

export default defineConfig({
	globalSetup: './e2e/global-setup.ts',
	webServer: {
		command: 'npm run build && npm run preview',
		port: PORT,
		env: { API_URL: `http://127.0.0.1:${API_PORT}` }
	},
	testMatch: '**/*.e2e.{ts,js}',
	use: { trace: 'retain-on-failure' }
});
