import { execFileSync } from 'node:child_process';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from './config';

// Creates the platform admin inside the running API container, which is the only way to
// make one. Without E2E_API_COMPOSE_DIR the admin must already exist.
export default function globalSetup() {
	const composeDir = process.env.E2E_API_COMPOSE_DIR;
	if (!composeDir) return;
	execFileSync(
		'docker',
		[
			'compose',
			'--profile',
			'app',
			'exec',
			'-T',
			'api',
			'/sijjel-api',
			'admin',
			'create',
			'--email',
			ADMIN_EMAIL,
			'--name',
			'E2E admin'
		],
		{ cwd: composeDir, input: `${ADMIN_PASSWORD}\n`, stdio: ['pipe', 'inherit', 'inherit'] }
	);
}
