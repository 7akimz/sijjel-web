import { expect, type Browser, type Page } from '@playwright/test';
import { ADMIN_PASSWORD, ADMIN_PHONE, academyUrl, platformUrl } from './config';

export const OWNER_PASSWORD = 'OwnerPassw0rd';

/** A local Egyptian mobile number unique to `seed`, so every person in a run has their own. */
export function e2ePhone(seed: string): string {
	let hash = 2166136261;
	for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
	return `010${String(hash % 100_000_000).padStart(8, '0')}`;
}

export async function signInAsPlatformAdmin(page: Page, url = platformUrl('/login')) {
	await page.goto(url);
	await page.getByLabel('Phone or email').fill(ADMIN_PHONE);
	await page.getByLabel('Password', { exact: true }).fill(ADMIN_PASSWORD);
	await page.locator('form').getByRole('button', { name: 'Sign in' }).click();
}

// createAcademy expects a platform admin page and creates an English-default academy in Egypt
// teaching Dressage and Show jumping, where riders book their own sessions unless staffBook.
export async function createAcademy(
	page: Page,
	slug: string,
	opts: { staffBook?: boolean } = {}
): Promise<{ name: string }> {
	const name = `E2E Academy ${slug}`;
	await page.goto(platformUrl('/platform/academies/new'));
	await page.getByLabel('Web address').fill(slug);
	await page.getByLabel('Name (English)').fill(name);
	await page.getByLabel('Name (Arabic)').fill(`أكاديمية ${slug}`);
	await page.getByRole('button', { name: 'Next' }).click();
	await page.getByLabel('Default language').selectOption('en');
	await page.getByLabel('Dressage').check();
	await page.getByLabel('Show jumping').check();
	if (opts.staffBook)
		await page.getByRole('radio', { name: /Staff book for their riders/ }).check();
	await page.getByRole('button', { name: 'Create academy' }).click();
	await expect(page.getByText(`${name} is created. Next, its package.`)).toBeVisible();
	await page.getByRole('button', { name: 'Finish later' }).click();
	await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
	return { name };
}

// openAcademy expects a platform admin page and opens the academy's page from the list, on a tab.
export async function openAcademy(
	page: Page,
	academyName: string,
	tab?: 'Subscription' | 'Settings'
): Promise<void> {
	await page.goto(platformUrl('/platform/academies'));
	await page.getByRole('link', { name: new RegExp(academyName) }).click();
	await expect(page.getByRole('heading', { name: academyName, level: 1 })).toBeVisible();
	if (tab) {
		await page
			.getByRole('navigation', { name: 'Academy views' })
			.getByRole('link', { name: tab })
			.click();
		await expect(page).toHaveURL(new RegExp(`tab=${tab.toLowerCase()}`));
	}
}

// ownerCard is the Owner card on an academy's Overview.
export const ownerCard = (page: Page) =>
	page.locator('.sj-card').filter({ has: page.getByRole('heading', { name: 'Owner' }) });

export async function inviteOwner(page: Page, academyName: string): Promise<string> {
	await openAcademy(page, academyName);
	const card = ownerCard(page);
	await card.getByRole('button', { name: 'Invite owner' }).click();
	await card.getByLabel('Their name').fill('Owner');
	await card.getByRole('button', { name: 'Create invitation' }).click();
	const link = await card.getByLabel('Invitation link').inputValue();
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
	await owner.getByLabel('Phone', { exact: true }).fill(e2ePhone(`owner-${slug}`));
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
	opts: { name: string; plan: string }
): Promise<string> {
	await owner.goto(academyUrl(slug, '/members/invite'));
	await owner.getByLabel('Their name').fill(opts.name);
	await owner.getByLabel('Discipline').selectOption({ label: 'Dressage' });
	await owner.getByLabel('Level').selectOption({ label: 'Intro' });
	await owner.getByLabel('Plan').selectOption({ label: opts.plan });
	await owner.getByRole('button', { name: 'Create invitation' }).click();
	await expect(owner.getByText('Invitation ready')).toBeVisible();
	return new URL(await owner.getByLabel('Invitation link').inputValue()).pathname;
}
