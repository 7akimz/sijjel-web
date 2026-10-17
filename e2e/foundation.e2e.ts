import { expect, test } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD, academyUrl, platformUrl } from './config';

test('a platform admin creates an academy and its owner joins through the invite', async ({
	page,
	request
}) => {
	const slug = `e2e${Date.now().toString(36)}`;
	const academy = `E2E Academy ${slug}`;

	await page.goto(platformUrl('/login'));
	await page.getByLabel('Email').fill(ADMIN_EMAIL);
	await page.getByLabel('Password').fill(ADMIN_PASSWORD);
	await page.locator('form').getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(platformUrl('/platform/academies'));

	await page.getByRole('button', { name: 'New academy' }).click();
	await page.getByLabel('Web address').fill(slug);
	await page.getByLabel('Name (English)').fill(academy);
	await page.getByLabel('Name (Arabic)').fill(`أكاديمية ${slug}`);
	await page.getByLabel('Default language').selectOption('en');
	await page.getByLabel('Dressage').check();
	await page.getByLabel('Show jumping').check();
	await page.getByRole('button', { name: 'Create academy' }).click();
	await expect(page.getByText('Academy created.')).toBeVisible();

	const row = page.getByRole('listitem').filter({ hasText: academy });
	await row.getByRole('button', { name: 'Invite owner' }).click();
	const link = await row.getByLabel('Invitation link').inputValue();
	const invitePath = new URL(link).pathname;
	expect(invitePath).toMatch(/^\/invite\/[\w-]+$/);

	const preview = await request.get(academyUrl(slug, invitePath));
	expect(preview.status()).toBe(200);
	const html = await preview.text();
	expect(html).toMatch(new RegExp(`<title>${academy}: invitation</title>`));
	expect(html).toContain(`property="og:title" content="${academy}: invitation"`);

	const owner = await page.context().browser()!.newPage();
	await owner.goto(academyUrl(slug, invitePath));
	await owner.getByLabel('Your name').fill('Owner');
	await owner.getByLabel('Email').fill(`owner-${slug}@example.test`);
	await owner.getByLabel('Password').fill('OwnerPassw0rd');
	await owner.getByRole('button', { name: 'Create your account' }).click();

	await expect(owner).toHaveURL(academyUrl(slug, '/'));
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
