import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_PHONE, API_PORT } from './config';

const composeFile = fileURLToPath(new URL('./compose.yaml', import.meta.url));

function compose(args: string[], input?: string) {
	execFileSync('docker', ['compose', '-f', composeFile, ...args], {
		input,
		stdio: [input === undefined ? 'ignore' : 'pipe', 'inherit', 'inherit'],
		env: { ...process.env, E2E_API_PORT: String(API_PORT) }
	});
}

const removeStack = () => compose(['down', '--volumes', '--remove-orphans']);

async function waitUntilReady() {
	const deadline = Date.now() + 60_000;
	while (Date.now() < deadline) {
		try {
			const response = await fetch(`http://127.0.0.1:${API_PORT}/health/ready`);
			if (response.ok) return;
		} catch {
			// The API is still starting.
		}
		await new Promise((resolve) => setTimeout(resolve, 500));
	}
	throw new Error(`the e2e API on port ${API_PORT} did not become ready`);
}

// Every run starts from an empty database and leaves nothing behind. The returned function is
// Playwright's global teardown.
export default async function globalSetup() {
	removeStack();
	try {
		compose(['up', '--detach', '--wait', 'postgres']);
		compose(['up', '--detach', 'api']);
		await waitUntilReady();
		compose(
			[
				'exec',
				'-T',
				'api',
				'/sijjel-api',
				'admin',
				'create',
				'--phone',
				ADMIN_PHONE,
				'--email',
				ADMIN_EMAIL,
				'--name',
				'Platform admin'
			],
			`${ADMIN_PASSWORD}\n`
		);
	} catch (error) {
		removeStack();
		throw error;
	}
	return removeStack;
}
