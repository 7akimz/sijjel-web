import { expect, test } from '@playwright/test';
import { academyUrl, platformUrl } from './config';
import { createAcademy, inviteOwner, signInAsPlatformAdmin, signUpOwner } from './helpers';

test('an owner sets up hours, arenas and a horse from the checklist', async ({ page, browser }) => {
	const slug = `setup${Date.now().toString(36)}`;
	await signInAsPlatformAdmin(page);
	await expect(page).toHaveURL(platformUrl('/platform/academies'));
	const { name } = await createAcademy(page, slug);
	const owner = await signUpOwner(browser, slug, await inviteOwner(page, name));

	const checklist = owner.locator('.sj-card', { hasText: 'ready for bookings' });
	await expect(checklist.getByText('0 of 3 done')).toBeVisible();

	await checklist.getByRole('link', { name: /Opening hours/ }).click();
	for (const day of ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday']) {
		await owner.getByRole('checkbox', { name: `Open on ${day}` }).check();
	}
	await owner.getByLabel('Saturday opens').fill('18:00');
	await owner.getByLabel('Saturday closes').fill('22:00');
	await owner.getByRole('button', { name: 'Copy to other open days from Saturday' }).click();
	await owner.getByLabel('Session length').selectOption('30');
	await expect(owner.getByText('8 sessions · 18:00 – 21:30').first()).toBeVisible();
	await owner.getByLabel('Saturday closes').fill('25:00');
	await owner.getByRole('button', { name: 'Save' }).click();
	await expect(owner.getByLabel('Saturday opens')).toBeFocused();
	await owner.getByLabel('Saturday closes').fill('24:00');
	await owner.getByRole('button', { name: 'Save' }).click();
	await expect(owner.getByText('Opening hours saved.')).toBeVisible();
	await expect(owner.getByLabel('Saturday closes')).toHaveValue('00:00');

	await owner.goto(academyUrl(slug, '/'));
	await expect(checklist.getByText('1 of 3 done')).toBeVisible();
	await checklist.getByRole('link', { name: /Arenas/ }).click();
	await owner.getByLabel('Name').fill('Main arena');
	await owner.getByLabel('Riders at once').fill('5');
	await owner.getByRole('button', { name: 'Add arena' }).click();
	await expect(owner.getByText('Arena saved.')).toBeVisible();

	await owner.goto(academyUrl(slug, '/'));
	await expect(checklist.getByText('2 of 3 done')).toBeVisible();
	await checklist.getByRole('link', { name: /Horses/ }).click();
	await owner.getByRole('link', { name: 'New horse' }).first().click();
	await owner.getByLabel('Name').fill('Zahra');
	await owner.getByLabel('Discipline').selectOption({ label: 'Dressage' });
	await owner.getByLabel('Lowest rider level').selectOption({ label: 'Intro' });
	await owner.getByLabel('Highest rider level').selectOption({ label: 'Novice' });
	await owner.getByRole('button', { name: 'Add horse' }).click();
	await expect(owner.getByRole('heading', { name: 'Zahra' })).toBeVisible();

	await owner.goto(academyUrl(slug, '/'));
	await expect(owner.getByText('ready for bookings')).toHaveCount(0);

	const outsider = await browser.newPage();
	await signInAsPlatformAdmin(outsider, academyUrl(slug, '/login'));
	await expect(outsider).toHaveURL(academyUrl(slug, '/'));
	const response = await outsider.goto(academyUrl(slug, '/settings'));
	expect(response?.status()).toBe(403);
	await expect(
		outsider.getByRole('heading', { name: "You don't have access to this page" })
	).toBeVisible();
});
