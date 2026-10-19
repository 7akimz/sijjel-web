import { expect, test, type Page } from '@playwright/test';
import { academyUrl, platformUrl } from './config';
import {
	createAcademy,
	inviteOwner,
	inviteRider,
	setUpAcademy,
	signInAsPlatformAdmin,
	signUpOwner
} from './helpers';

async function signUpRider(page: Page, slug: string, invitePath: string, name: string) {
	await page.goto(academyUrl(slug, invitePath));
	await page.getByLabel('Your name').fill(name);
	await page.getByLabel('Email').fill(`${name.toLowerCase()}-${slug}@example.test`);
	await page.getByLabel('Password').fill('RiderPassw0rd');
	await page.getByRole('button', { name: 'Create your account' }).click();
	await expect(page).toHaveURL(academyUrl(slug, '/'));
}

test('staff plan a session: place a rider, suggest a horse, set a trainer and note the ride', async ({
	page,
	browser
}) => {
	test.slow();
	const slug = `board${Date.now().toString(36)}`;
	await signInAsPlatformAdmin(page);
	await expect(page).toHaveURL(platformUrl('/platform/academies'));
	const { name } = await createAcademy(page, slug);
	const owner = await signUpOwner(browser, slug, await inviteOwner(page, name));
	await setUpAcademy(owner, slug);

	await owner.goto(academyUrl(slug, '/horses/new'));
	await owner.getByLabel('Name').fill('Badr');
	await owner.getByLabel('Discipline').selectOption({ label: 'Dressage' });
	await owner.getByLabel('Lowest rider level').selectOption({ label: 'Intro' });
	await owner.getByLabel('Highest rider level').selectOption({ label: 'Novice' });
	await owner.getByRole('button', { name: 'Add horse' }).click();
	await expect(owner.getByRole('heading', { name: 'Badr' })).toBeVisible();

	await owner.goto(academyUrl(slug, '/settings/plans'));
	await owner.getByLabel('Name (English)').fill('Dressage, 2 a week');
	await owner.getByLabel('Name (Arabic)').fill('ترويض، مرتان في الأسبوع');
	await owner.getByLabel('Sessions a week').fill('2');
	await owner.getByLabel('Monthly price').fill('1000');
	await owner.getByRole('button', { name: 'Add plan' }).click();
	await expect(owner.getByText('Plan saved.')).toBeVisible();

	const riders: Page[] = [];
	for (const riderName of ['Layla', 'Sara']) {
		const invitePath = await inviteRider(owner, slug, {
			name: riderName,
			age: 14,
			plan: 'Dressage, 2 a week'
		});
		const rider = await browser.newPage();
		await signUpRider(rider, slug, invitePath, riderName);
		riders.push(rider);
	}

	const host = academyUrl(slug, '');
	const today = new Date().toISOString().slice(0, 10);
	const inTwoWeeks = new Date(Date.now() + 13 * 86_400_000).toISOString().slice(0, 10);
	const slots = (await (
		await riders[0].request.get(`${host}/api/slots?from=${today}&to=${inTwoWeeks}`)
	).json()) as { date: string; start: string; canBook: boolean }[];
	const slot = slots.find((s) => s.canBook)!;
	for (const rider of riders) {
		const response = await rider.request.post(`${host}/api/bookings`, {
			headers: { origin: host },
			data: { date: slot.date, start: slot.start }
		});
		expect(response.status()).toBe(201);
	}

	await owner.goto(academyUrl(slug, `/board?date=${slot.date}&start=${slot.start}`));
	await expect(owner.getByRole('heading', { name: 'Not placed' })).toBeVisible();
	await expect(owner.getByRole('button', { name: /Layla.*Pick horse/ })).toBeVisible();
	await expect(owner.getByRole('button', { name: /Sara.*Pick horse/ })).toBeVisible();

	await owner.getByRole('button', { name: /Layla/ }).click();
	await owner.getByRole('radio', { name: /Zahra/ }).check();
	await owner.getByRole('radio', { name: /Main arena/ }).check();
	await owner.getByRole('button', { name: 'Save' }).click();
	await expect(owner.getByText('Saved.')).toBeVisible();
	await expect(owner.getByRole('button', { name: /Layla.*Zahra/ })).toBeVisible();

	await owner.getByRole('button', { name: 'Suggest horses' }).click();
	await expect(owner.getByText('Horses suggested for 1 riders.')).toBeVisible();
	await expect(owner.getByRole('button', { name: /Sara.*Badr/ })).toBeVisible();

	await owner.getByRole('button', { name: 'Trainer for Main arena' }).click();
	await owner.getByRole('dialog').getByRole('button', { name: 'Owner' }).click();
	await expect(owner.getByRole('heading', { name: 'Main arena · Owner' })).toBeVisible();

	await owner.getByRole('button', { name: /Layla.*Zahra/ }).click();
	await owner.getByLabel('Note on this ride').fill('Leg kept coming out in canter.');
	await owner.getByRole('button', { name: 'Save' }).click();
	await expect(owner.getByText('Saved.')).toBeVisible();
	await owner.getByRole('button', { name: /Layla.*Zahra/ }).click();
	await expect(owner.getByLabel('Note on this ride')).toHaveValue('Leg kept coming out in canter.');
});
