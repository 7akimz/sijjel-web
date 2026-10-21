import { describe, expect, it } from 'vitest';
import type { AcademyTenant } from '#lib/api/types.js';
import { webManifest } from './manifest';

const academy: AcademyTenant = {
	slug: 'alfaris',
	nameEn: 'Al Faris',
	nameAr: 'الفارس',
	defaultLanguage: 'ar',
	timeZone: 'Africa/Cairo',
	primaryColor: '#1f6f5c',
	disciplines: []
};

describe('webManifest', () => {
	it('installs an academy under its own name, in the visitor’s language', () => {
		const manifest = webManifest({ kind: 'academy', academy }, 'ar');
		expect(manifest).toMatchObject({
			name: 'الفارس',
			short_name: 'الفارس',
			lang: 'ar',
			dir: 'rtl',
			start_url: '/',
			display: 'standalone'
		});
		expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/);
		expect(manifest.theme_color).not.toBe('#7a5230');
		expect(manifest.icons.map((i) => i.sizes)).toEqual(['192x192', '512x512']);
	});

	it('names the platform sijjel', () => {
		expect(webManifest({ kind: 'platform' }, 'en')).toMatchObject({
			name: 'sijjel',
			dir: 'ltr',
			theme_color: '#7a5230'
		});
	});
});
