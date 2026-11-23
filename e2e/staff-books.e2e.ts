import { expect, test } from '@playwright/test';
import { academyUrl, platformUrl } from './config';
import {
	createAcademy,
	e2ePhone,
	inviteOwner,
	setUpAcademy,
	signInAsPlatformAdmin,
	signUpOwner
} from './helpers';

test('where staff book, the owner adds a rider without an account, books their month and invites them later', async ({
	page,
	browser
}) => {
	test.slow();
	const slug = `staff${Date.now().toString(36)}`;
	await signInAsPlatformAdmin(page);
	await expect(page).toHaveURL(platformUrl('/platform/academies'));
	const { name } = await createAcademy(page, slug, { staffBook: true });
	const owner = await signUpOwner(browser, slug, await inviteOwner(page, name));
	await setUpAcademy(owner, slug);

	await owner.goto(academyUrl(slug, '/settings'));
	await expect(owner.getByRole('link', { name: /Opening hours/ })).toBeVisible();
	await expect(owner.getByRole('link', { name: /Booking rules/ })).toHaveCount(0);

	await owner.goto(academyUrl(slug, '/settings/plans'));
	await owner.getByLabel('Name (English)').fill('Dressage, 8 a month');
	await owner.getByLabel('Name (Arabic)').fill('ترويض، 8 في الشهر');
	await owner.getByLabel('Lessons a month').fill('8');
	await owner.getByLabel('Monthly price').fill('1000');
	await owner.getByRole('button', { name: 'Add plan' }).click();
	await expect(owner.getByText('Plan saved.')).toBeVisible();

	const phone = e2ePhone(`layla-${slug}`);
	await owner.goto(academyUrl(slug, '/members'));
	await owner.getByRole('link', { name: 'Add rider' }).click();
	await expect(owner.getByRole('heading', { name: 'Add rider' })).toBeVisible();
	await owner.getByLabel('Their name').fill('Layla');
	await owner.getByLabel('Phone', { exact: true }).fill(phone);
	await owner.getByLabel('Discipline').selectOption({ label: 'Dressage' });
	await owner.getByLabel('Level').selectOption({ label: 'Intro' });
	await owner.getByLabel('Plan').selectOption({ label: 'Dressage, 8 a month' });
	await owner.getByRole('button', { name: 'Add rider' }).click();

	await expect(owner.getByRole('heading', { name: 'Layla' })).toBeVisible();
	await expect(owner.getByText('No account')).toBeVisible();
	await expect(owner.getByText("Layla can't open sijjel yet.")).toBeVisible();

	await owner.getByRole('link', { name: 'Book a month' }).click();
	await owner.getByRole('main').getByRole('link', { name: 'Layla', exact: true }).click();
	await expect(owner.getByRole('heading', { name: 'Layla' })).toBeVisible();
	await owner.getByRole('link', { name: 'Book a month' }).click();
	// Next month always has every 18:00 session still ahead of it, whatever today is.
	const next = owner.getByRole('link', { name: 'Next month' });
	if (await next.isVisible()) await next.click();
	const sixPm = owner.getByRole('button', { name: /^18:00 \d+ of \d+$/ });
	await sixPm.nth(0).click();
	await sixPm.nth(1).click();
	await owner.getByRole('button', { name: /^Book \d+ sessions$/ }).click();
	await owner.getByRole('button', { name: 'Yes, book it' }).click();
	await expect(owner.getByText(/^Booked \d+ sessions for Layla in \w+\.$/)).toBeVisible();

	await owner.getByRole('button', { name: 'Send invite link' }).click();
	const link = await owner.getByLabel('Invitation link').inputValue();

	const layla = await browser.newPage();
	await layla.goto(link.replace(/^https?:\/\/[^/]+/, academyUrl(slug, '')));
	await layla.getByLabel('Your name').fill('Layla Hassan');
	await layla.getByLabel('Password', { exact: true }).fill('RiderPassw0rd');
	await layla.getByRole('button', { name: 'Create your account' }).click();
	await expect(layla).toHaveURL(academyUrl(slug, '/'));

	await expect(layla.getByText('School horse').first()).toBeVisible();
	await expect(
		layla.getByText('Your academy books your sessions. Call them to change one.')
	).toBeVisible();
	await expect(layla.getByRole('link', { name: 'Book a session' })).toHaveCount(0);
	await expect(layla.getByRole('button', { name: 'Cancel', exact: true })).toHaveCount(0);

	await layla.goto(academyUrl(slug, '/book'));
	await expect(layla).toHaveURL(academyUrl(slug, '/'));
});
