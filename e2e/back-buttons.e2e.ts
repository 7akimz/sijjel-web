import { expect, test } from '@playwright/test';
import { academyUrl, platformUrl } from './config';
import { createAcademy, inviteOwner, signInAsPlatformAdmin, signUpOwner } from './helpers';

test('every page one level down has a way back up', async ({ page, browser }) => {
	test.slow();
	const slug = `back${Date.now().toString(36)}`;
	await signInAsPlatformAdmin(page);
	await expect(page).toHaveURL(platformUrl('/platform/academies'));
	const { name } = await createAcademy(page, slug);
	const owner = await signUpOwner(browser, slug, await inviteOwner(page, name));
	const content = owner.getByRole('main');

	for (const section of [
		'hours',
		'arenas',
		'plans',
		'booking-rules',
		'closed-dates',
		'disciplines',
		'branding',
		'subscription'
	]) {
		await owner.goto(academyUrl(slug, `/settings/${section}`));
		await content.getByRole('link', { name: 'Settings', exact: true }).click();
		await expect(owner).toHaveURL(academyUrl(slug, '/settings'));
	}

	await owner.goto(academyUrl(slug, '/horses/new'));
	await content.getByRole('link', { name: 'All horses' }).click();
	await expect(owner).toHaveURL(academyUrl(slug, '/horses'));
});
