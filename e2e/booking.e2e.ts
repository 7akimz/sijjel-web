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

test('an owner invites a rider who books and cancels a session', async ({ page, browser }) => {
	test.slow();
	const slug = `book${Date.now().toString(36)}`;
	await signInAsPlatformAdmin(page);
	await expect(page).toHaveURL(platformUrl('/platform/academies'));
	const { name } = await createAcademy(page, slug);
	const owner = await signUpOwner(browser, slug, await inviteOwner(page, name));
	await setUpAcademy(owner, slug);

	await owner.setViewportSize({ width: 390, height: 844 });
	await owner.goto(academyUrl(slug, '/settings/booking-rules'));
	await owner.getByLabel('Booking opens (days ahead)').fill('14');
	await owner.getByRole('button', { name: 'Save' }).click();
	await expect(owner.getByText('Booking rules saved.')).toBeInViewport();
	await owner.setViewportSize({ width: 1280, height: 720 });

	await owner.goto(academyUrl(slug, '/settings/plans'));
	await owner.getByLabel('Name (English)').fill('Dressage, 8 a month');
	await owner.getByLabel('Name (Arabic)').fill('ترويض، 8 في الشهر');
	await owner.getByLabel('Lessons a month').fill('8');
	await owner.getByLabel('Monthly price').fill('1000');
	await owner.getByRole('button', { name: 'Add plan' }).click();
	await expect(owner.getByText('Plan saved.')).toBeVisible();

	const invitePath = await inviteRider(owner, slug, {
		name: 'Layla',
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
	await layla.getByLabel('Phone', { exact: true }).fill(e2ePhone(`layla-${slug}`));
	await layla.getByLabel('Email').fill(`layla-${slug}@example.test`);
	await layla.getByLabel('Password', { exact: true }).fill('RiderPassw0rd');
	await layla.getByRole('button', { name: 'Create your account' }).click();
	await expect(layla).toHaveURL(academyUrl(slug, '/'));
	await expect(layla.getByText('Left this month: 8 of 8')).toBeVisible();
	await expect(layla.getByText('EGP 1,000 a month')).toBeVisible();

	await layla.getByRole('link', { name: 'Book a session' }).click();
	await expect(layla.getByRole('heading', { name: 'Book a session' })).toBeVisible();
	await expect(layla.getByText('You can book up to 14 days ahead.')).toBeVisible();
	// The last session next week is at least six days away, well before the 12-hour cancellation
	// cutoff and inside the 14-day booking window the owner set, whatever the time of week. It may
	// fall in next month and leave this month's count alone.
	await layla.getByRole('link', { name: 'Next week' }).click();
	await expect(layla).toHaveURL(/[?&]week=/);
	await layla.getByRole('button', { name: 'Book', exact: true }).last().click();
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
	await row.getByRole('link', { name: /^Layla/ }).click();
	const thisMonth = owner
		.locator('section')
		.filter({ has: owner.getByRole('heading', { name: 'This month' }) });
	await expect(thisMonth.getByText('Not paid')).toBeVisible();
	await thisMonth.getByRole('button', { name: 'Mark paid' }).click();
	await expect(owner.getByText(/^\w+ marked paid\.$/)).toBeVisible();
	await expect(thisMonth).toHaveCount(0);
	await expect(owner.locator('header').getByText(/^Paid for \w+$/)).toBeVisible();
	await owner.getByRole('button', { name: 'More actions' }).click();
	await expect(owner.getByRole('menuitem', { name: /^Mark \w+ not paid$/ })).toBeVisible();
	await owner.keyboard.press('Escape');
	await owner.goto(academyUrl(slug, '/members'));
	await expect(row).toBeVisible();
	await expect(row.getByText('Unpaid this month')).toHaveCount(0);
});

test('staff book a month of fixed days for a rider, who then sees them', async ({
	page,
	browser
}) => {
	test.slow();
	const slug = `month${Date.now().toString(36)}`;
	await signInAsPlatformAdmin(page);
	await expect(page).toHaveURL(platformUrl('/platform/academies'));
	const { name } = await createAcademy(page, slug);
	const owner = await signUpOwner(browser, slug, await inviteOwner(page, name));
	await setUpAcademy(owner, slug);

	await owner.goto(academyUrl(slug, '/settings/plans'));
	await owner.getByLabel('Name (English)').fill('Dressage, 12 a month');
	await owner.getByLabel('Name (Arabic)').fill('ترويض، 12 في الشهر');
	await owner.getByLabel('Lessons a month').fill('12');
	await owner.getByLabel('Monthly price').fill('1500');
	await owner.getByRole('button', { name: 'Add plan' }).click();
	await expect(owner.getByText('Plan saved.')).toBeVisible();

	const invitePath = await inviteRider(owner, slug, {
		name: 'Layla',
		plan: 'Dressage, 12 a month'
	});
	const layla = await browser.newPage();
	await layla.goto(academyUrl(slug, invitePath));
	await layla.getByLabel('Your name').fill('Layla');
	await layla.getByLabel('Phone', { exact: true }).fill(e2ePhone(`layla-${slug}`));
	await layla.getByLabel('Email').fill(`layla-${slug}@example.test`);
	await layla.getByLabel('Password', { exact: true }).fill('RiderPassw0rd');
	await layla.getByRole('button', { name: 'Create your account' }).click();
	await expect(layla).toHaveURL(academyUrl(slug, '/'));

	await owner.setViewportSize({ width: 390, height: 844 });
	await owner.goto(academyUrl(slug, '/members'));
	await owner.getByRole('link', { name: /^Layla/ }).click();
	await owner.getByRole('link', { name: 'Book a month' }).click();
	await expect(owner.getByRole('heading', { name: 'Book a month for Layla' })).toBeVisible();
	// Next month always has every 18:00 session still ahead of it, whatever today is.
	const next = owner.getByRole('link', { name: 'Next month' });
	if (await next.isVisible()) await next.click();
	await expect(owner.getByRole('button', { name: 'Next month' })).toBeDisabled();

	const sixPm = owner.getByRole('button', { name: /^18:00 \d+ of \d+$/ });
	await sixPm.nth(0).click();
	await sixPm.nth(1).click();
	await expect(sixPm.nth(0)).toHaveAttribute('aria-pressed', 'true');
	const book = owner.getByRole('button', { name: /^Book \d+ sessions$/ });
	await expect(book).toBeInViewport();
	const sessions = Number((await book.textContent())?.match(/\d+/)?.[0]);
	expect(sessions).toBeGreaterThanOrEqual(8);
	await book.click();
	await owner.getByRole('button', { name: 'Yes, book it' }).click();

	await expect(
		owner.getByText(new RegExp(`^Booked ${sessions} sessions for Layla in \\w+\\.$`))
	).toBeVisible();
	await expect(owner.getByRole('heading', { name: 'Layla' })).toBeVisible();

	await layla.reload();
	await expect(layla.getByText('School horse').first()).toBeVisible();
});

test('closing a booked day tells the rider why and offers the group message', async ({
	page,
	browser
}) => {
	test.slow();
	const slug = `close${Date.now().toString(36)}`;
	await signInAsPlatformAdmin(page);
	await expect(page).toHaveURL(platformUrl('/platform/academies'));
	const { name } = await createAcademy(page, slug);
	const owner = await signUpOwner(browser, slug, await inviteOwner(page, name));
	await setUpAcademy(owner, slug);

	await owner.goto(academyUrl(slug, '/settings/booking-rules'));
	await owner.getByLabel('Booking opens (days ahead)').fill('14');
	await owner.getByRole('button', { name: 'Save' }).click();
	await expect(owner.getByText('Booking rules saved.')).toBeVisible();

	await owner.goto(academyUrl(slug, '/settings/plans'));
	await owner.getByLabel('Name (English)').fill('Dressage, 8 a month');
	await owner.getByLabel('Name (Arabic)').fill('ترويض، 8 في الشهر');
	await owner.getByLabel('Lessons a month').fill('8');
	await owner.getByLabel('Monthly price').fill('1000');
	await owner.getByRole('button', { name: 'Add plan' }).click();
	await expect(owner.getByText('Plan saved.')).toBeVisible();

	const invitePath = await inviteRider(owner, slug, {
		name: 'Layla',
		plan: 'Dressage, 8 a month'
	});
	const layla = await browser.newPage();
	await layla.goto(academyUrl(slug, invitePath));
	await layla.getByLabel('Your name').fill('Layla');
	await layla.getByLabel('Phone', { exact: true }).fill(e2ePhone(`layla-${slug}`));
	await layla.getByLabel('Email').fill(`layla-${slug}@example.test`);
	await layla.getByLabel('Password', { exact: true }).fill('RiderPassw0rd');
	await layla.getByRole('button', { name: 'Create your account' }).click();
	await expect(layla).toHaveURL(academyUrl(slug, '/'));

	await layla.goto(academyUrl(slug, '/book'));
	await layla.getByRole('link', { name: 'Next week' }).click();
	await expect(layla).toHaveURL(/[?&]week=\d{4}-\d{2}-\d{2}/);
	const week = new URL(layla.url()).searchParams.get('week')!;
	await layla.getByRole('button', { name: 'Book', exact: true }).last().click();
	await layla.getByRole('button', { name: 'Yes, book it' }).click();
	await expect(layla.getByText(/^Booked for/)).toBeVisible();

	// Closing the whole of next week covers Layla's session whichever day it fell on.
	const end = new Date(`${week}T00:00:00Z`);
	end.setUTCDate(end.getUTCDate() + 6);
	await owner.goto(academyUrl(slug, '/settings/closed-dates'));
	await owner.getByLabel('Closed from').fill(week);
	await owner.getByLabel('Closed to').fill(end.toISOString().slice(0, 10));
	await owner.getByLabel('Reason (optional)').fill('Spring show');
	await owner.getByRole('button', { name: 'Add closed dates' }).click();
	await owner.getByRole('button', { name: 'Close these days and cancel the bookings' }).click();
	await expect(owner.getByRole('link', { name: 'Share on WhatsApp' })).toHaveAttribute(
		'href',
		/^https:\/\/wa\.me\/\?text=/
	);

	await layla.goto(academyUrl(slug, '/'));
	await expect(layla.getByText('Cancelled: Spring show')).toBeVisible();
});
