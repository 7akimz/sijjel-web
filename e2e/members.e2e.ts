import { expect, test, type Page } from '@playwright/test';
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

async function addDressagePlan(owner: Page, slug: string, name: string, level: string) {
	await owner.goto(academyUrl(slug, '/settings/plans'));
	await owner.getByLabel('Name (English)').fill(name);
	await owner.getByLabel('Name (Arabic)').fill(name);
	await owner.getByLabel('Lessons a month').fill('8');
	await owner.getByLabel('Monthly price').fill('1000');
	await owner.getByLabel('Discipline (optional)').selectOption({ label: 'Dressage' });
	await owner.getByLabel(level, { exact: true }).check();
	await owner.getByRole('button', { name: 'Add plan' }).click();
	await expect(owner.getByText('Plan saved.')).toBeVisible();
}

async function signUp(page: Page, slug: string, invitePath: string, name: string) {
	await page.goto(academyUrl(slug, invitePath));
	await page.getByLabel('Your name').fill(name);
	await page.getByLabel('Phone', { exact: true }).fill(e2ePhone(`${name.toLowerCase()}-${slug}`));
	await page.getByLabel('Email').fill(`${name.toLowerCase()}-${slug}@example.test`);
	await page.getByLabel('Password', { exact: true }).fill('RiderPassw0rd');
	await page.getByRole('button', { name: 'Create your account' }).click();
	await expect(page).toHaveURL(academyUrl(slug, '/'));
}

test('a trainer moves a rider up next month and the owner sees the history', async ({
	page,
	browser
}) => {
	test.slow();
	const slug = `move${Date.now().toString(36)}`;
	await signInAsPlatformAdmin(page);
	await expect(page).toHaveURL(platformUrl('/platform/academies'));
	const { name } = await createAcademy(page, slug);
	const owner = await signUpOwner(browser, slug, await inviteOwner(page, name));
	await setUpAcademy(owner, slug);
	await addDressagePlan(owner, slug, 'Beginner, 8 a month', 'Intro');
	await addDressagePlan(owner, slug, 'Preliminary, 8 a month', 'Preliminary');

	const laylaInvite = await inviteRider(owner, slug, {
		name: 'Layla',
		age: 14,
		plan: 'Beginner, 8 a month'
	});
	await signUp(await browser.newPage(), slug, laylaInvite, 'Layla');

	await owner.goto(academyUrl(slug, '/members/invite'));
	await owner.getByLabel('Who are you inviting?').selectOption({ label: 'A trainer' });
	await owner.getByLabel('Their name').fill('Omar');
	await owner.getByLabel('Phone (optional)').fill('1012345678');
	await owner.getByRole('button', { name: 'Create invitation' }).click();
	await expect(owner.getByText('Invitation ready')).toBeVisible();
	await expect(owner.getByRole('link', { name: 'Send on WhatsApp' })).toHaveAttribute(
		'href',
		/^https:\/\/wa\.me\/201012345678\?/
	);
	const omar = await browser.newPage();
	await signUp(
		omar,
		slug,
		new URL(await owner.getByLabel('Invitation link').inputValue()).pathname,
		'Omar'
	);

	await omar.goto(academyUrl(slug, '/members'));
	await omar.getByRole('link', { name: /Layla/ }).click();
	await expect(omar.getByRole('heading', { name: 'Layla' })).toBeVisible();
	await expect(omar.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
	await expect(omar.getByText('Dressage · Intro', { exact: true }).last()).toBeVisible();

	await omar.getByRole('button', { name: 'Move to Preliminary' }).click();
	await expect(omar.getByRole('radio', { name: /^From 1 / })).toBeChecked();
	await omar.getByLabel('Plan').selectOption({ label: 'Preliminary, 8 a month' });
	await omar.getByRole('button', { name: 'Move', exact: true }).click();

	const comingMove = /^Moves to Dressage · Preliminary on 1 \w+$/;
	const comingPlan = /^Plan changes to Preliminary, 8 a month on 1 \w+$/;
	await expect(omar.getByText(comingMove)).toBeVisible();
	await expect(omar.getByText(comingPlan)).toBeVisible();

	await owner.goto(academyUrl(slug, '/members'));
	await owner.getByRole('link', { name: /Layla/ }).click();
	const levelCard = owner
		.locator('section')
		.filter({ has: owner.getByRole('heading', { name: 'Level', exact: true }) });
	await expect(levelCard.getByText(comingMove)).toBeVisible();
	await expect(levelCard.getByText(comingPlan)).toBeVisible();
	await expect(levelCard.getByText(/^Started at Intro · /)).toBeVisible();
	// The profile form still selects the current plan and names the saved change under it.
	await expect(owner.getByLabel('Plan')).toHaveValue(/.+/);
	await expect(owner.locator('.sj-hint').getByText(comingPlan)).toBeVisible();

	await owner.getByRole('button', { name: 'Cancel move' }).click();
	await expect(owner.getByText(comingMove)).toHaveCount(0);
	await expect(owner.getByText(comingPlan)).toHaveCount(0);
	await expect(owner.getByRole('button', { name: 'Move to Preliminary' })).toBeVisible();
});

test('an owner marks a rider as left and can bring them back', async ({ page, browser }) => {
	test.slow();
	const slug = `left${Date.now().toString(36)}`;
	await signInAsPlatformAdmin(page);
	await expect(page).toHaveURL(platformUrl('/platform/academies'));
	const { name } = await createAcademy(page, slug);
	const owner = await signUpOwner(browser, slug, await inviteOwner(page, name));
	await setUpAcademy(owner, slug);
	await addDressagePlan(owner, slug, 'Beginner, 8 a month', 'Intro');
	const laylaInvite = await inviteRider(owner, slug, {
		name: 'Layla',
		age: 14,
		plan: 'Beginner, 8 a month'
	});
	const layla = await browser.newPage();
	await signUp(layla, slug, laylaInvite, 'Layla');

	await owner.goto(academyUrl(slug, '/members'));
	await owner.getByRole('link', { name: /Layla/ }).click();
	await owner.getByRole('button', { name: 'Mark as left' }).click();
	await expect(owner.getByText('Marked as left.')).toBeVisible();
	await owner.goto(academyUrl(slug, '/members'));
	const row = owner.getByRole('listitem').filter({ hasText: 'Layla' });
	await expect(row.getByText('Left', { exact: true })).toBeVisible();

	await layla.reload();
	await expect(layla.getByText("You're no longer a member here.")).toBeVisible();
	await expect(layla.getByRole('link', { name: 'Book a session' })).toHaveCount(0);

	await row.getByRole('link', { name: /Layla/ }).click();
	await owner.getByRole('button', { name: 'Reactivate' }).click();
	await expect(owner.getByText('Member reactivated.')).toBeVisible();
	await layla.reload();
	await expect(layla.getByRole('link', { name: 'Book a session' })).toBeVisible();
});
