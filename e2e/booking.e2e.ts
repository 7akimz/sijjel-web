import { expect, test } from '@playwright/test';
import { academyUrl, platformUrl } from './config';
import {
	createAcademy,
	inviteOwner,
	inviteRider,
	setUpAcademy,
	signInAsPlatformAdmin,
	signUpOwner
} from './helpers';

test('an owner invites a rider who books and cancels a session', async ({ page, browser }) => {
	test.slow();
	const slug = `book${Date.now().toString(36)}`;
	await signInAsPlatformAdmin(page);
	await expect(page).toHaveURL(platformUrl('/platform/academies'));
	const { name } = await createAcademy(page, slug);
	const owner = await signUpOwner(browser, slug, await inviteOwner(page, name));
	await setUpAcademy(owner, slug);

	await owner.goto(academyUrl(slug, '/settings/plans'));
	await owner.getByLabel('Name (English)').fill('Dressage, 8 a month');
	await owner.getByLabel('Name (Arabic)').fill('ترويض، 8 في الشهر');
	await owner.getByLabel('Lessons a month').fill('8');
	await owner.getByLabel('Monthly price').fill('1000');
	await owner.getByRole('button', { name: 'Add plan' }).click();
	await expect(owner.getByText('Plan saved.')).toBeVisible();

	const invitePath = await inviteRider(owner, slug, {
		name: 'Layla',
		age: 14,
		plan: 'Dressage, 8 a month'
	});
	await expect(owner.getByRole('link', { name: 'Send on WhatsApp' })).toHaveAttribute(
		'href',
		/^https:\/\/wa\.me\//
	);
	await expect(owner.locator('.qr svg')).toBeVisible();

	const layla = await browser.newPage();
	await layla.goto(academyUrl(slug, invitePath));
	await layla.getByLabel('Your name').fill('Layla');
	await layla.getByLabel('Email').fill(`layla-${slug}@example.test`);
	await layla.getByLabel('Password').fill('RiderPassw0rd');
	await layla.getByRole('button', { name: 'Create your account' }).click();
	await expect(layla).toHaveURL(academyUrl(slug, '/'));
	await expect(layla.getByText('Left this month: 8 of 8')).toBeVisible();
	await expect(layla.getByText('EGP 1,000 a month')).toBeVisible();

	await layla.getByRole('link', { name: 'Book a session' }).click();
	// Late on a Friday the current week may have nothing left. A session next week, or late in
	// the month this week, may fall in next month and leave this month's count alone.
	const bookThisWeek = (await layla.getByRole('button', { name: 'Book', exact: true }).count()) > 0;
	if (!bookThisWeek) await layla.getByRole('link', { name: 'Next week' }).click();
	await layla.getByRole('button', { name: 'Book', exact: true }).first().click();
	await layla.getByRole('button', { name: 'Yes, book it' }).click();
	await expect(layla.getByText(/^Booked for/)).toBeVisible();

	await layla.getByRole('link', { name: 'Home' }).first().click();
	await expect(layla.getByText(/^Left this month: [78] of 8$/)).toBeVisible();
	await expect(layla.getByText('School horse')).toBeVisible();

	await layla.getByRole('button', { name: 'Cancel', exact: true }).click();
	await expect(layla.getByText('Booking cancelled.')).toBeVisible();
	await expect(layla.getByText('Left this month: 8 of 8')).toBeVisible();
	await expect(layla.getByText('No upcoming bookings.')).toBeVisible();

	await owner.goto(academyUrl(slug, '/members'));
	const row = owner.getByRole('listitem').filter({ hasText: 'Layla' });
	await expect(row.getByText('Unpaid this month')).toBeVisible();
	await row.getByRole('link', { name: /Layla/ }).click();
	await owner.getByRole('button', { name: 'Mark paid' }).click();
	await expect(owner.getByText('Paid', { exact: true })).toBeVisible();
	await owner.goto(academyUrl(slug, '/members'));
	await expect(row).toBeVisible();
	await expect(row.getByText('Unpaid this month')).toHaveCount(0);
});
