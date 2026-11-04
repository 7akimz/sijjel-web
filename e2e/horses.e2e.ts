import { expect, test } from '@playwright/test';
import { academyUrl, platformUrl } from './config';
import {
	createAcademy,
	inviteOwner,
	setUpAcademy,
	signInAsPlatformAdmin,
	signUpOwner
} from './helpers';

test("an owner marks a horse unavailable and edits its details from the horse's page", async ({
	page,
	browser
}) => {
	const slug = `horses${Date.now().toString(36)}`;
	await signInAsPlatformAdmin(page);
	await expect(page).toHaveURL(platformUrl('/platform/academies'));
	const { name } = await createAcademy(page, slug);
	const owner = await signUpOwner(browser, slug, await inviteOwner(page, name));
	await setUpAcademy(owner, slug);

	await owner.goto(academyUrl(slug, '/horses'));
	await owner.getByRole('link', { name: /Zahra/ }).click();
	await expect(owner.getByRole('heading', { name: 'Zahra', level: 1 })).toBeVisible();
	await expect(owner.getByLabel('Name')).not.toBeVisible();

	await owner.getByRole('button', { name: 'Mark unavailable' }).click();
	await owner.getByLabel('From').fill('2099-01-10');
	await owner.getByLabel('To').fill('2099-01-12');
	await owner.getByLabel('Reason (optional)').fill('Shoeing');
	await owner.getByRole('button', { name: 'Add dates' }).click();
	await expect(owner.getByText('10 January 2099 – 12 January 2099')).toBeVisible();
	await expect(owner.getByText('Shoeing')).toBeVisible();
	await expect(owner.getByLabel('Reason (optional)')).not.toBeVisible();

	await owner.getByRole('link', { name: 'Edit horse' }).click();
	await expect(owner.getByRole('heading', { name: 'Edit Zahra' })).toBeVisible();
	await owner.getByLabel('Sessions a day').selectOption({ label: '2 a day' });
	await owner.getByRole('button', { name: 'Save' }).click();

	await expect(owner.getByRole('heading', { name: 'Zahra', level: 1 })).toBeVisible();
	await expect(owner.getByText('Horse saved.')).toBeVisible();
	await expect(owner.getByText('Up to 2 sessions a day')).toBeVisible();
	await expect(owner.getByText('Shoeing')).toBeVisible();
});
