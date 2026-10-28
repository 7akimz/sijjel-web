import { expect, test, type Page } from '@playwright/test';
import { academyUrl, platformUrl } from './config';
import { createAcademy, inviteOwner, signInAsPlatformAdmin, signUpOwner } from './helpers';

// drawImage paints a navy picture in the page and returns it as a file for an upload input.
async function drawImage(
	page: Page,
	width: number,
	height: number,
	type: 'image/png' | 'image/jpeg'
) {
	const dataUrl = await page.evaluate(
		([w, h, t]) => {
			const canvas = document.createElement('canvas');
			canvas.width = w;
			canvas.height = h;
			const context = canvas.getContext('2d')!;
			context.fillStyle = '#29344F';
			context.fillRect(0, 0, w, h);
			context.fillStyle = '#C9A227';
			context.fillRect(w / 4, h / 4, w / 2, h / 2);
			return canvas.toDataURL(t, 0.9);
		},
		[width, height, type] as const
	);
	const buffer = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
	return { name: type === 'image/png' ? 'logo.png' : 'cover.jpg', mimeType: type, buffer };
}

test('an owner brands their academy and visitors see it', async ({ page, browser }) => {
	const slug = `brand${Date.now().toString(36)}`;
	await signInAsPlatformAdmin(page);
	await expect(page).toHaveURL(platformUrl('/platform/academies'));
	const { name } = await createAcademy(page, slug);
	const owner = await signUpOwner(browser, slug, await inviteOwner(page, name));

	await owner.goto(academyUrl(slug, '/settings'));
	await owner.getByRole('link', { name: /Branding/ }).click();
	await expect(owner.getByRole('heading', { name: 'Branding', level: 1 })).toBeVisible();

	await owner.getByLabel('Upload logo').setInputFiles(await drawImage(owner, 64, 64, 'image/png'));
	await expect(owner.getByRole('radio', { name: 'Colour 1' })).toBeChecked();
	await owner
		.getByLabel('Upload cover photo')
		.setInputFiles(await drawImage(owner, 2000, 1200, 'image/jpeg'));
	await owner.getByLabel('Welcome line (English)').fill('Flatwork in Cairo');
	await owner.getByRole('button', { name: 'Save' }).click();
	await expect(owner.getByText('Saved.')).toBeVisible();

	const visitor = await browser.newPage();
	await visitor.goto(academyUrl(slug, '/'));
	await expect(visitor.locator('a.brand img')).toBeVisible();
	await expect(visitor.locator('img.photo')).toBeVisible();
	await expect(visitor.getByText('Flatwork in Cairo')).toBeVisible();
	const ogImage = await visitor.locator('meta[property="og:image"]').getAttribute('content');
	expect(ogImage).toMatch(/\/api\/files\/[0-9a-f-]{36}$/);
	const cover = await visitor.request.get(ogImage!);
	expect(cover.headers()['content-type']).toBe('image/jpeg');
});
