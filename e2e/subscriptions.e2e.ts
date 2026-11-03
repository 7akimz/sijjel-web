import { expect, test } from '@playwright/test';
import { academyUrl, platformUrl } from './config';
import {
	createAcademy,
	e2ePhone,
	inviteOwner,
	inviteRider,
	setUpAcademy,
	signInAsPlatformAdmin,
	signUpOwner
} from './helpers';

test('a platform admin sets up a package, academies see what they owe, and blocking pauses booking', async ({
	page,
	browser
}) => {
	test.slow();
	const slug = `subs${Date.now().toString(36)}`;
	const packageName = `Starter ${slug}`;
	await signInAsPlatformAdmin(page);
	await expect(page).toHaveURL(platformUrl('/platform/academies'));

	await page.goto(platformUrl('/platform/packages'));
	await page.getByLabel('Name (English)').fill(packageName);
	await page.getByLabel('Name (Arabic)').fill(`مبتدئ ${slug}`);
	await page.getByLabel('Riders (empty for unlimited)').fill('2');
	await page.getByLabel('Monthly price').fill('1500');
	await page.getByRole('button', { name: 'Add package' }).click();
	await expect(page.getByText('Package saved.')).toBeVisible();

	const { name } = await createAcademy(page, slug);
	const owner = await signUpOwner(browser, slug, await inviteOwner(page, name));

	const openSubscription = async () => {
		await page.goto(platformUrl('/platform/academies'));
		await page
			.getByRole('listitem')
			.filter({ hasText: name })
			.getByRole('link', { name: `Subscription for ${name}` })
			.click();
		await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
	};
	await openSubscription();
	await page.getByLabel('Package').selectOption({ label: packageName });
	await page.getByLabel('Free days to start with').fill('0');
	await page.getByRole('button', { name: 'Save package' }).click();
	await expect(page.getByText('Saved.')).toBeVisible();

	await owner.reload();
	await expect(owner.getByText(/^Unpaid: 1 month · EGP\s1,500\. /)).toBeVisible();
	await expect(owner.getByText('Pay by InstaPay or cash and let us know.')).toBeVisible();

	await page.getByRole('button', { name: 'Mark month paid' }).click();
	await expect(page.getByText(/^Paid month · EGP\s1,500 · InstaPay/)).toBeVisible();
	await owner.reload();
	await expect(owner.getByText('Pay by InstaPay or cash and let us know.')).toHaveCount(0);

	await setUpAcademy(owner, slug);
	await owner.goto(academyUrl(slug, '/settings/plans'));
	await owner.getByLabel('Name (English)').fill('Dressage, 8 a month');
	await owner.getByLabel('Name (Arabic)').fill('ترويض، 8 في الشهر');
	await owner.getByLabel('Lessons a month').fill('8');
	await owner.getByLabel('Monthly price').fill('1000');
	await owner.getByRole('button', { name: 'Add plan' }).click();
	await expect(owner.getByText('Plan saved.')).toBeVisible();

	const laylaInvite = await inviteRider(owner, slug, {
		name: 'Layla',
		plan: 'Dressage, 8 a month'
	});
	await inviteRider(owner, slug, { name: 'Sara', plan: 'Dressage, 8 a month' });
	await owner.goto(academyUrl(slug, '/members/invite'));
	await expect(owner.getByText('Riders: 2 of 2')).toBeVisible();
	await expect(owner.getByText(/^You've reached your package's rider limit\./)).toBeVisible();
	await expect(owner.getByRole('option', { name: 'A rider' })).toBeDisabled();

	const layla = await browser.newPage();
	await layla.goto(academyUrl(slug, laylaInvite));
	await layla.getByLabel('Your name').fill('Layla');
	await layla.getByLabel('Phone', { exact: true }).fill(e2ePhone(`layla-${slug}`));
	await layla.getByLabel('Email').fill(`layla-${slug}@example.test`);
	await layla.getByLabel('Password', { exact: true }).fill('RiderPassw0rd');
	await layla.getByRole('button', { name: 'Create your account' }).click();
	await expect(layla).toHaveURL(academyUrl(slug, '/'));

	await page.getByRole('button', { name: 'Block booking' }).click();
	await page.getByRole('button', { name: 'Yes, block booking' }).click();
	await expect(page.getByRole('button', { name: 'Unblock' })).toBeVisible();

	await layla.goto(academyUrl(slug, '/book'));
	await expect(
		layla.getByText('Booking is paused at this academy. Please contact the academy.')
	).toBeVisible();
	await expect(
		layla.getByRole('button', { name: 'Book', exact: true, disabled: false })
	).toHaveCount(0);
	await expect(layla.getByText(/subscription|InstaPay/)).toHaveCount(0);

	await page.getByRole('button', { name: 'Mark month paid' }).click();
	await expect(page.getByRole('button', { name: 'Block booking' })).toBeVisible();
	await page.goto(platformUrl('/platform/academies'));
	const row = page.getByRole('listitem').filter({ hasText: name });
	await expect(row.getByText('Paid', { exact: true })).toBeVisible();
	await expect(row.getByText('Blocked', { exact: true })).toHaveCount(0);
});
