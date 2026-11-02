import { expect, test, type Browser, type Page } from '@playwright/test';
import { academyUrl, platformUrl } from './config';
import {
	createAcademy,
	inviteOwner,
	inviteRider,
	setUpAcademy,
	signInAsPlatformAdmin,
	signUpOwner
} from './helpers';

const NOUR_PHONE = '01055500011';
const NOUR_PASSWORD = 'NourPassw0rd';

async function academyWithRiderInvite(admin: Page, browser: Browser, slug: string) {
	const { name } = await createAcademy(admin, slug);
	const owner = await signUpOwner(browser, slug, await inviteOwner(admin, name));
	await setUpAcademy(owner, slug);
	await owner.goto(academyUrl(slug, '/settings/plans'));
	await owner.getByLabel('Name (English)').fill('Dressage, 8 a month');
	await owner.getByLabel('Name (Arabic)').fill('ترويض، 8 في الشهر');
	await owner.getByLabel('Lessons a month').fill('8');
	await owner.getByLabel('Monthly price').fill('1000');
	await owner.getByRole('button', { name: 'Add plan' }).click();
	await expect(owner.getByText('Plan saved.')).toBeVisible();
	const invitePath = await inviteRider(owner, slug, {
		name: 'Nour',
		age: 15,
		plan: 'Dressage, 8 a month'
	});
	return { name, invitePath };
}

test('a rider joins a second academy by signing in with their phone in Arabic digits', async ({
	page,
	browser
}) => {
	test.slow();
	const stamp = Date.now().toString(36);
	const first = `pa${stamp}`;
	const second = `pb${stamp}`;
	await signInAsPlatformAdmin(page);
	await expect(page).toHaveURL(platformUrl('/platform/academies'));
	const a = await academyWithRiderInvite(page, browser, first);
	const b = await academyWithRiderInvite(page, browser, second);

	const atFirst = await browser.newPage();
	await atFirst.goto(academyUrl(first, a.invitePath));
	await atFirst.getByLabel('Your name').fill('Nour');
	await atFirst.getByLabel('Phone', { exact: true }).fill(NOUR_PHONE);
	await atFirst.getByLabel('Password', { exact: true }).fill(NOUR_PASSWORD);
	await atFirst.getByRole('button', { name: 'Create your account' }).click();
	await expect(atFirst).toHaveURL(academyUrl(first, '/'));

	const atSecond = await browser.newPage();
	await atSecond.goto(academyUrl(second, b.invitePath));
	await atSecond.getByLabel('Your name').fill('Nour');
	await atSecond.getByLabel('Phone', { exact: true }).fill(NOUR_PHONE);
	await atSecond.getByLabel('Password', { exact: true }).fill(NOUR_PASSWORD);
	await atSecond.getByRole('button', { name: 'Create your account' }).click();
	await expect(
		atSecond.getByText(`You already have a sijjel account. Sign in to join ${b.name}.`)
	).toBeVisible();

	await atSecond.getByRole('main').getByRole('link', { name: 'Sign in' }).click();
	await expect(atSecond.getByLabel('Phone or email')).toHaveValue(NOUR_PHONE);

	const returning = await browser.newPage();
	await returning.goto(academyUrl(second, b.invitePath));
	const signInFirst = returning.getByRole('link', { name: 'Already have an account? Sign in' });
	await expect(returning.locator('form').getByRole('link', { name: /Sign in/ })).toHaveCount(0);
	await signInFirst.click();
	await returning.getByLabel('Phone or email').fill('٠١٠٥٥٥٠٠٠١١');
	await returning.getByLabel('Password', { exact: true }).fill(NOUR_PASSWORD);
	await returning.locator('form').getByRole('button', { name: 'Sign in' }).click();
	await expect(returning).toHaveURL(academyUrl(second, b.invitePath));
	await returning.getByRole('button', { name: 'Accept invitation' }).click();
	await expect(returning).toHaveURL(academyUrl(second, '/'));

	const backAtFirst = await browser.newPage();
	await backAtFirst.goto(academyUrl(first, '/login'));
	await backAtFirst.getByLabel('Phone or email').fill('+20 105 550 0011');
	await backAtFirst.getByLabel('Password', { exact: true }).fill(NOUR_PASSWORD);
	await backAtFirst.locator('form').getByRole('button', { name: 'Sign in' }).click();
	await expect(backAtFirst).toHaveURL(academyUrl(first, '/'));
});
