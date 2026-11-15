import { expect, test } from '@playwright/test';
import { academyUrl, platformUrl } from './config';
import {
	OWNER_PASSWORD,
	createAcademy,
	e2ePhone,
	inviteOwner,
	signInAsPlatformAdmin,
	signUpOwner
} from './helpers';

test('someone in one academy who signs in on the platform lands in it, signed in', async ({
	page,
	browser
}) => {
	const slug = `mine${Date.now().toString(36)}`;
	await signInAsPlatformAdmin(page);
	await expect(page).toHaveURL(platformUrl('/platform/academies'));
	const { name } = await createAcademy(page, slug);
	await (await signUpOwner(browser, slug, await inviteOwner(page, name))).close();

	const owner = await (await browser.newContext()).newPage();
	const links: string[] = [];
	owner.on('request', (request) => {
		if (request.url().includes('/sign-in-link?')) links.push(request.url());
	});
	await owner.goto(platformUrl('/login'));
	await owner.getByLabel('Phone or email').fill(e2ePhone(`owner-${slug}`));
	await owner.getByLabel('Password', { exact: true }).fill(OWNER_PASSWORD);
	await owner.locator('form').getByRole('button', { name: 'Sign in' }).click();

	await expect(owner).toHaveURL(academyUrl(slug, '/'));
	await expect(owner.getByText('ready for bookings')).toBeVisible();
	expect(links).toHaveLength(1);

	const replay = await (await browser.newContext()).newPage();
	await replay.goto(links[0]);
	await expect(replay).toHaveURL(academyUrl(slug, '/login'));
});
