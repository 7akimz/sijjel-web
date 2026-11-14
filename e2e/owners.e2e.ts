import { expect, test } from '@playwright/test';
import { academyUrl, platformUrl } from './config';
import { createAcademy, setUpAcademy, signInAsPlatformAdmin, signUpOwner } from './helpers';

test('a platform admin follows an owner invite, and the free days wait for setup', async ({
	page,
	browser,
	request
}) => {
	test.slow();
	const slug = `ownr${Date.now().toString(36)}`;
	const packageName = `Owners ${slug}`;
	await signInAsPlatformAdmin(page);
	await expect(page).toHaveURL(platformUrl('/platform/academies'));

	await page.goto(platformUrl('/platform/packages'));
	await page.getByLabel('Name (English)').fill(packageName);
	await page.getByLabel('Name (Arabic)').fill(`باقة ${slug}`);
	await page.getByLabel('Monthly price').fill('1500');
	await page.getByRole('button', { name: 'Add package' }).click();
	await expect(page.getByText('Package saved.')).toBeVisible();

	const { name } = await createAcademy(page, slug);
	const row = () => page.getByRole('listitem').filter({ hasText: name });
	await expect(row().getByText('No invite sent')).toBeVisible();
	await row().getByRole('button', { name: 'Invite owner' }).click();
	await row().getByLabel('Their name').fill('Karim');
	await row().getByRole('button', { name: 'Create invitation' }).click();
	const firstPath = new URL(await row().getByLabel('Invitation link').inputValue()).pathname;
	await expect(row().getByText('Invite sent today, not accepted yet')).toBeVisible();

	await page.reload();
	await expect(row().getByText('Invite sent today, not accepted yet')).toBeVisible();
	await row().getByRole('button', { name: 'Send again' }).click();
	await expect(row().getByText(/the old link no longer works/)).toBeVisible();
	await expect(row().getByRole('link', { name: 'Send on WhatsApp' })).toBeVisible();
	const invitePath = new URL(await row().getByLabel('Invitation link').inputValue()).pathname;
	expect(invitePath).not.toBe(firstPath);
	expect((await request.get(academyUrl(slug, firstPath))).status()).toBe(404);

	await row()
		.getByRole('link', { name: `Subscription for ${name}` })
		.click();
	await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
	await expect(page.getByText('Karim')).toBeVisible();
	await page.getByLabel('Package').selectOption({ label: packageName });
	await expect(page.getByLabel('Start the free days when setup is finished')).toBeChecked();
	await page.getByRole('button', { name: 'Save package' }).click();
	await expect(page.getByText('30 free days start when setup is finished.')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Start the trial now' })).toBeVisible();

	const owner = await signUpOwner(browser, slug, invitePath);
	await page.goto(platformUrl('/platform/academies'));
	await expect(row().getByText('Owner: Owner')).toBeVisible();
	await expect(row().getByText('Setup: 0 of 4')).toBeVisible();
	await expect(row().getByText('Trial waits for setup')).toBeVisible();

	await owner.goto(academyUrl(slug, '/settings/subscription'));
	await expect(owner.getByRole('heading', { name: packageName })).toBeVisible();
	await expect(owner.getByText(/trial|free|due on|Pay by InstaPay/i)).toHaveCount(0);

	await setUpAcademy(owner, slug);
	await owner.goto(academyUrl(slug, '/settings/plans'));
	await owner.getByLabel('Name (English)').fill('Dressage, 8 a month');
	await owner.getByLabel('Name (Arabic)').fill('ترويض، 8 في الشهر');
	await owner.getByLabel('Lessons a month').fill('8');
	await owner.getByLabel('Monthly price').fill('1000');
	await owner.getByRole('button', { name: 'Add plan' }).click();
	await expect(owner.getByText('Plan saved.')).toBeVisible();

	await owner.goto(academyUrl(slug, '/settings/subscription'));
	await expect(owner.getByText('Active', { exact: true })).toBeVisible();
	await expect(owner.getByText(/^Next payment due on /)).toBeVisible();
	await expect(owner.getByText(/^First month · /)).toBeVisible();

	await page.reload();
	await expect(row().getByText(/^Set up on /)).toBeVisible();
	await expect(row().getByText('Free', { exact: true })).toBeVisible();
});
