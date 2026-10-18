import { expect, test } from '@playwright/test';
import { academyUrl, platformUrl } from './config';
import { createAcademy, inviteOwner, signInAsPlatformAdmin, signUpOwner } from './helpers';

test('a platform admin creates an academy and its owner joins through the invite', async ({
	page,
	request
}) => {
	const slug = `e2e${Date.now().toString(36)}`;

	await signInAsPlatformAdmin(page);
	await expect(page).toHaveURL(platformUrl('/platform/academies'));
	const { name: academy } = await createAcademy(page, slug);
	const invitePath = await inviteOwner(page, academy);
	expect(invitePath).toMatch(/^\/invite\/[\w-]+$/);

	const preview = await request.get(academyUrl(slug, invitePath));
	expect(preview.status()).toBe(200);
	const html = await preview.text();
	expect(html).toMatch(new RegExp(`<title>${academy}: invitation</title>`));
	expect(html).toContain(`property="og:title" content="${academy}: invitation"`);

	const owner = await signUpOwner(page.context().browser()!, slug, invitePath);

	await expect(owner.getByRole('heading', { name: `Welcome to ${academy}` })).toBeVisible();
	await expect(owner.getByText('Admin', { exact: true })).toBeVisible();

	const accent = await owner.evaluate(() => ({
		computed: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
		injected: document
			.getElementById('academy-accent')
			?.textContent?.match(/--accent:([^;}]+)/)?.[1]
	}));
	expect(accent.injected).toMatch(/^#[0-9a-f]{6}$/i);
	expect(accent.computed.toLowerCase()).toBe(accent.injected!.toLowerCase());

	await owner.getByRole('button', { name: 'العربية' }).click();
	await expect(owner.locator('html')).toHaveAttribute('dir', 'rtl');
	await expect(owner.getByText('مشرف', { exact: true })).toBeVisible();

	const theme = owner.getByRole('button', { name: /المظهر/ });
	await theme.click();
	await theme.click();
	await expect(owner.locator('html')).toHaveAttribute('data-theme', 'dark');
	await owner.reload();
	await expect(owner.locator('html')).toHaveAttribute('data-theme', 'dark');

	await owner.getByRole('button', { name: 'تسجيل الخروج' }).click();
	await expect(owner.getByRole('link', { name: 'تسجيل الدخول' }).first()).toBeVisible();
	await owner.reload();
	await expect(owner.getByRole('button', { name: 'تسجيل الخروج' })).toHaveCount(0);

	const reused = await request.get(academyUrl(slug, invitePath));
	expect(reused.status()).toBe(404);
});

test('an unknown academy gets a branded 404 and no sign-in', async ({ page }) => {
	const response = await page.goto(academyUrl('no-such-academy', '/'));

	expect(response?.status()).toBe(404);
	await expect(page.getByRole('heading', { name: "We couldn't find this academy" })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Sign in' })).toHaveCount(0);
});
