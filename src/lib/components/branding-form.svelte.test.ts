import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Branding } from '#lib/api/branding-types.js';
import BrandingForm from './BrandingForm.svelte';

vi.mock('#lib/forms/image.js', () => {
	const navy = new Uint8ClampedArray(Array.from({ length: 64 }, () => [41, 52, 79, 255]).flat());
	return {
		ImageError: class extends Error {},
		loadImage: vi.fn(async () => ({ width: 8, height: 8 })),
		resizeImage: vi.fn(
			async () => new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' })
		),
		imagePixels: vi.fn(() => navy)
	};
});

type Call = { url: string; method: string; body: unknown };

const branding = (overrides: Partial<Branding> = {}): Branding => ({
	primaryColor: '#7A5230',
	welcomeTextEn: null,
	welcomeTextAr: null,
	logoUrl: null,
	coverUrl: null,
	...overrides
});

let calls: Call[];

function stubFetch(respond: (call: Call) => Response) {
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string, init: RequestInit = {}) => {
			const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
			const call = { url, method: init.method ?? 'GET', body };
			calls.push(call);
			return respond(call);
		})
	);
}

const problem = (status: number, body: object) =>
	new Response(JSON.stringify({ status, ...body }), {
		status,
		headers: { 'content-type': 'application/problem+json' }
	});

beforeEach(() => {
	calls = [];
	vi.stubGlobal(
		'URL',
		Object.assign(URL, { createObjectURL: () => 'blob:preview', revokeObjectURL: () => {} })
	);
});
afterEach(() => vi.unstubAllGlobals());

const file = () => new File([new Uint8Array([1, 2, 3])], 'logo.png', { type: 'image/png' });

async function pick(screen: ReturnType<typeof render>, label: string) {
	await screen.getByLabelText(label).upload(file());
}

describe('BrandingForm', () => {
	it('suggests the logo colour after picking a logo', async () => {
		stubFetch(() => Response.json({}));
		const screen = render(BrandingForm, { branding: branding(), onsaved: () => {} });

		await pick(screen, 'Upload logo');

		const first = screen.getByRole('radio', { name: 'Colour 1' });
		await expect.element(first).toBeChecked();
		expect(first.element().getAttribute('value')).toBe('#29344F');
		expect(calls).toHaveLength(0);
	});

	it('saves the logo before the colour and welcome lines', async () => {
		const saved = branding({
			primaryColor: '#29344F',
			welcomeTextEn: 'Flatwork in Cairo',
			logoUrl: '/api/files/l'
		});
		stubFetch((call) =>
			Response.json(call.url.endsWith('/logo') ? { ...branding(), logoUrl: '/api/files/l' } : saved)
		);
		const onsaved = vi.fn();
		const screen = render(BrandingForm, { branding: branding(), onsaved });

		await pick(screen, 'Upload logo');
		await screen.getByLabelText('Welcome line (English)').fill('Flatwork in Cairo');
		await screen.getByRole('button', { name: 'Save' }).click();

		await expect.element(screen.getByText('Saved.')).toBeVisible();
		expect(calls.map((c) => [c.method, c.url])).toEqual([
			['PUT', '/api/academy/branding/logo'],
			['PUT', '/api/academy/branding']
		]);
		expect(calls[0].body).toBeInstanceOf(Blob);
		expect(calls[1].body).toEqual({
			primaryColor: '#29344F',
			welcomeTextEn: 'Flatwork in Cairo',
			welcomeTextAr: ''
		});
		expect(onsaved).toHaveBeenCalledWith(saved);
	});

	it('stops when an upload fails', async () => {
		stubFetch(() => problem(400, { code: 'image_invalid' }));
		const screen = render(BrandingForm, { branding: branding(), onsaved: () => {} });

		await pick(screen, 'Upload logo');
		await screen.getByRole('button', { name: 'Save' }).click();

		const logoSection = screen.getByRole('group', { name: 'Logo' });
		await expect
			.element(logoSection.getByText("This photo couldn't be used. Try a JPEG or PNG."))
			.toBeVisible();
		expect(calls).toHaveLength(1);
	});

	it('removes the cover', async () => {
		stubFetch(() => Response.json(branding()));
		const screen = render(BrandingForm, {
			branding: branding({ coverUrl: '/api/files/c' }),
			onsaved: () => {}
		});

		await screen
			.getByRole('group', { name: 'Cover photo' })
			.getByRole('button', { name: 'Remove' })
			.click();
		await screen.getByRole('button', { name: 'Save' }).click();

		await expect.element(screen.getByText('Saved.')).toBeVisible();
		expect(calls.map((c) => [c.method, c.url])).toEqual([
			['DELETE', '/api/academy/branding/cover'],
			['PUT', '/api/academy/branding']
		]);
	});

	it('checks the welcome length', async () => {
		stubFetch(() => Response.json(branding()));
		const screen = render(BrandingForm, { branding: branding(), onsaved: () => {} });

		await screen.getByLabelText('Welcome line (Arabic)').fill('ع'.repeat(201));
		await screen.getByRole('button', { name: 'Save' }).click();

		await expect
			.element(screen.getByText('Keep the welcome line to 200 characters.'))
			.toBeVisible();
		expect(calls).toHaveLength(0);
	});

	it('keeps the current colour selected when it is not a suggestion', async () => {
		stubFetch(() => Response.json({}));
		const screen = render(BrandingForm, {
			branding: branding({ primaryColor: '#1E6B52' }),
			onsaved: () => {}
		});

		const radios = screen.getByRole('radio').all();
		expect(radios.map((r) => r.element().getAttribute('value'))).toEqual(['#1E6B52', '#7A5230']);
		await expect.element(screen.getByRole('radio', { name: 'Colour 1' })).toBeChecked();
	});
});
