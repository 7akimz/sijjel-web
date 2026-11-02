import { expect, test } from '@playwright/test';
import { academyUrl, platformUrl } from './config';
import {
	createAcademy,
	e2ePhone,
	inviteOwner,
	signInAsPlatformAdmin,
	signUpOwner
} from './helpers';

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

test('a platform admin invites an owner by phone, and the owner signs up with it locked', async ({
	page,
	browser
}) => {
	const slug = `own${Date.now().toString(36)}`;
	const phone = e2ePhone(`mona-${slug}`);
	await signInAsPlatformAdmin(page);
	await expect(page).toHaveURL(platformUrl('/platform/academies'));
	const { name: academy } = await createAcademy(page, slug);

	const row = page.getByRole('listitem').filter({ hasText: academy });
	await row.getByRole('button', { name: 'Invite owner' }).click();
	await row.getByLabel('Their name').fill('Mona');
	await row.getByLabel('Phone (optional)').fill(phone);
	await row.getByLabel('Email (optional)').fill(`mona-${slug}@example.test`);
	await row.getByRole('button', { name: 'Create invitation' }).click();

	const whatsapp = row.getByRole('link', { name: 'Send on WhatsApp' });
	await expect(whatsapp).toHaveAttribute(
		'href',
		new RegExp(`^https://wa\\.me/20${phone.slice(1)}\\?text=.*set%20up`)
	);
	await expect(row.getByRole('img', { name: 'Or let them scan this code' })).toBeVisible();
	const invitePath = new URL(await row.getByLabel('Invitation link').inputValue()).pathname;

	const owner = await browser.newPage();
	await owner.goto(academyUrl(slug, invitePath));
	await expect(owner.getByLabel('Your name')).toHaveValue('Mona');
	const phoneField = owner.getByLabel('Phone', { exact: true });
	await expect(phoneField).toHaveValue(`+20${phone.slice(1)}`);
	await expect(phoneField).toHaveAttribute('readonly');
	await expect(owner.getByLabel('Email (optional)')).toHaveAttribute('readonly');
	await owner.getByLabel('Password', { exact: true }).fill('OwnerPassw0rd');
	await owner.getByRole('button', { name: 'Create your account' }).click();
	await expect(owner.getByRole('heading', { name: `Welcome to ${academy}` })).toBeVisible();
});

test('an unknown academy gets a branded 404 and no sign-in', async ({ page }) => {
	const response = await page.goto(academyUrl('no-such-academy', '/'));

	expect(response?.status()).toBe(404);
	await expect(page.getByRole('heading', { name: "We couldn't find this academy" })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Sign in' })).toHaveCount(0);
});
