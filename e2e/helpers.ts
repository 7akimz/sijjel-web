import { expect, type Browser, type Page } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD, academyUrl, platformUrl } from './config';

export const OWNER_PASSWORD = 'OwnerPassw0rd';

export async function signInAsPlatformAdmin(page: Page, url = platformUrl('/login')) {
	await page.goto(url);
	await page.getByLabel('Email').fill(ADMIN_EMAIL);
	await page.getByLabel('Password').fill(ADMIN_PASSWORD);
	await page.locator('form').getByRole('button', { name: 'Sign in' }).click();
}

// createAcademy expects a platform admin page and creates an English-default academy teaching
// Dressage and Show jumping.
export async function createAcademy(page: Page, slug: string): Promise<{ name: string }> {
	const name = `E2E Academy ${slug}`;
	await page.goto(platformUrl('/platform/academies'));
	await page.getByRole('button', { name: 'New academy' }).click();
	await page.getByLabel('Web address').fill(slug);
	await page.getByLabel('Name (English)').fill(name);
	await page.getByLabel('Name (Arabic)').fill(`أكاديمية ${slug}`);
	await page.getByLabel('Default language').selectOption('en');
	await page.getByLabel('Dressage').check();
	await page.getByLabel('Show jumping').check();
	await page.getByRole('button', { name: 'Create academy' }).click();
	await expect(page.getByText('Academy created.')).toBeVisible();
	return { name };
}

export async function inviteOwner(page: Page, academyName: string): Promise<string> {
	const row = page.getByRole('listitem').filter({ hasText: academyName });
	await row.getByRole('button', { name: 'Invite owner' }).click();
	const link = await row.getByLabel('Invitation link').inputValue();
	return new URL(link).pathname;
}

export async function signUpOwner(
	browser: Browser,
	slug: string,
	invitePath: string
): Promise<Page> {
	const owner = await browser.newPage();
	await owner.goto(academyUrl(slug, invitePath));
	await owner.getByLabel('Your name').fill('Owner');
	await owner.getByLabel('Email').fill(`owner-${slug}@example.test`);
	await owner.getByLabel('Password').fill(OWNER_PASSWORD);
	await owner.getByRole('button', { name: 'Create your account' }).click();
	await expect(owner).toHaveURL(academyUrl(slug, '/'));
	return owner;
}
