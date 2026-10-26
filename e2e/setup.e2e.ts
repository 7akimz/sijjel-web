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
	await expect(checklist.getByText('0 of 4 done')).toBeVisible();

	const nav = owner.getByRole('navigation', { name: 'Main' }).first();
	await expect(nav.getByRole('link', { name: 'Board' })).toHaveCount(0);
	await expect(nav.getByText('Board')).toHaveAttribute('aria-disabled', 'true');
	await owner.goto(academyUrl(slug, '/board'));
	await expect(
		owner.getByRole('heading', { name: 'The board opens once setup is finished' })
	).toBeVisible();
	await owner.goto(academyUrl(slug, '/members/invite'));
	await expect(owner.getByLabel('Who are you inviting?')).toHaveValue('trainer');
	await owner.goto(academyUrl(slug, '/'));

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

	await expect(owner.getByRole('link', { name: 'Next: add your arenas' })).toBeInViewport();
	await owner.getByRole('link', { name: 'Next: add your arenas' }).click();
	await expect(owner.getByRole('heading', { name: 'Arenas', level: 1 })).toBeVisible();
	await owner.getByLabel('Name').fill('Main arena');
	await owner.getByLabel('Riders at once').fill('5');
	await owner.getByRole('button', { name: 'Add arena' }).click();
	await expect(owner.getByText('Arena saved.')).toBeVisible();

	await owner.getByRole('link', { name: 'Next: add your horses' }).click();
	await expect(owner.getByRole('heading', { name: 'New horse', level: 1 })).toBeVisible();
	await owner.getByLabel('Name').fill('Zahra');
	await owner.getByLabel('Discipline').selectOption({ label: 'Dressage' });
	await owner.getByLabel('Lowest rider level').selectOption({ label: 'Intro' });
	await owner.getByLabel('Highest rider level').selectOption({ label: 'Novice' });
	await owner.getByRole('button', { name: 'Add horse' }).click();
	await expect(owner.getByText('Zahra added.')).toBeVisible();
	await expect(owner.getByLabel('Name')).toHaveValue('');
	await expect(owner.getByRole('link', { name: 'Next: add a plan' })).toBeInViewport();
	await owner.getByRole('link', { name: 'Next: add a plan' }).click();
	await expect(owner.getByRole('heading', { name: 'Plans', level: 1 })).toBeVisible();
	await owner.getByLabel('Name (English)').fill('Dressage, 8 a month');
	await owner.getByLabel('Name (Arabic)').fill('ترويض، 8 في الشهر');
	await owner.getByLabel('Lessons a month').fill('8');
	await owner.getByLabel('Monthly price').fill('1000');
	await owner.getByRole('button', { name: 'Add plan' }).click();
	await expect(owner.getByText('Plan saved.')).toBeVisible();
	await expect(
		owner.getByRole('link', { name: 'Setup done: invite your riders' })
	).toBeInViewport();
	await owner.getByRole('link', { name: 'Setup done: invite your riders' }).click();
	await expect(owner).toHaveURL(academyUrl(slug, '/members/invite'));
	await expect(owner.getByLabel('Who are you inviting?')).toHaveValue('rider');
	await expect(nav.getByRole('link', { name: 'Board' })).toBeVisible();

	await owner.goto(academyUrl(slug, '/'));
	await expect(owner.getByText('ready for bookings')).toHaveCount(0);
	await expect(owner.getByText('No riders booked today.')).toBeVisible();
	await expect(owner.getByRole('link', { name: 'Open the board' })).toBeVisible();
	await expect(owner.getByText('Booking opens soon')).toHaveCount(0);
	await expect(nav.getByRole('link', { name: 'Board' })).toBeVisible();

	const outsider = await browser.newPage();
	await signInAsPlatformAdmin(outsider, academyUrl(slug, '/login'));
	await expect(outsider).toHaveURL(academyUrl(slug, '/'));
	const response = await outsider.goto(academyUrl(slug, '/settings'));
	expect(response?.status()).toBe(403);
	await expect(
		outsider.getByRole('heading', { name: "You don't have access to this page" })
	).toBeVisible();
});
