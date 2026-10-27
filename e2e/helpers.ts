import { expect, type Browser, type Page } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD, academyUrl, platformUrl } from './config';

export const OWNER_PASSWORD = 'OwnerPassw0rd';

export async function signInAsPlatformAdmin(page: Page, url = platformUrl('/login')) {
	await page.goto(url);
	await page.getByLabel('Email').fill(ADMIN_EMAIL);
	await page.getByLabel('Password', { exact: true }).fill(ADMIN_PASSWORD);
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
	await owner.getByLabel('Password', { exact: true }).fill(OWNER_PASSWORD);
	await owner.getByRole('button', { name: 'Create your account' }).click();
	await expect(owner).toHaveURL(academyUrl(slug, '/'));
	return owner;
}

// setUpAcademy expects the owner's page and fills in the setup checklist up to plans: open every day
// around the clock with 30-minute sessions, so a slot is always bookable, plus one arena and one horse.
// Callers add the plan their riders need.
export async function setUpAcademy(owner: Page, slug: string) {
	await owner.goto(academyUrl(slug, '/settings/hours'));
	for (const day of [
		'Saturday',
		'Sunday',
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday'
	]) {
		await owner.getByRole('checkbox', { name: `Open on ${day}` }).check();
	}
	await owner.getByLabel('Saturday opens').fill('00:00');
	await owner.getByLabel('Saturday closes').fill('24:00');
	await owner.getByRole('button', { name: 'Copy to other open days from Saturday' }).click();
	await owner.getByLabel('Session length').selectOption('30');
	await owner.getByRole('button', { name: 'Save' }).click();
	await expect(owner.getByText('Opening hours saved.')).toBeVisible();

	await owner.goto(academyUrl(slug, '/settings/arenas'));
	await owner.getByLabel('Name').fill('Main arena');
	await owner.getByLabel('Riders at once').fill('5');
	await owner.getByRole('button', { name: 'Add arena' }).click();
	await expect(owner.getByText('Arena saved.')).toBeVisible();

	await owner.goto(academyUrl(slug, '/horses/new'));
	await owner.getByLabel('Name').fill('Zahra');
	await owner.getByLabel('Discipline').selectOption({ label: 'Dressage' });
	await owner.getByLabel('Lowest rider level').selectOption({ label: 'Intro' });
	await owner.getByLabel('Highest rider level').selectOption({ label: 'Novice' });
	await owner.getByRole('button', { name: 'Add horse' }).click();
	await expect(owner.getByRole('heading', { name: 'Zahra' })).toBeVisible();
}

// inviteRider fills the invitation form on the owner's page and returns the invitation's path.
export async function inviteRider(
	owner: Page,
	slug: string,
	opts: { name: string; age: number; plan: string }
): Promise<string> {
	await owner.goto(academyUrl(slug, '/members/invite'));
	await owner.getByLabel('Who are you inviting?').selectOption({ label: 'A rider' });
	await owner.getByLabel('Their name').fill(opts.name);
	await owner.getByLabel('Age').fill(String(opts.age));
	await owner.getByLabel('Discipline').selectOption({ label: 'Dressage' });
	await owner.getByLabel('Level').selectOption({ label: 'Intro' });
	await owner.getByLabel('Plan').selectOption({ label: opts.plan });
	await owner.getByRole('button', { name: 'Create invitation' }).click();
	await expect(owner.getByText('Invitation ready')).toBeVisible();
	return new URL(await owner.getByLabel('Invitation link').inputValue()).pathname;
}
