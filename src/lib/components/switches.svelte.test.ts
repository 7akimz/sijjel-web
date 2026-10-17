import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LanguageSwitch from './LanguageSwitch.svelte';
import ThemeSwitch from './ThemeSwitch.svelte';

describe('ThemeSwitch', () => {
	it('cycles from the device setting to day to night', async () => {
		const screen = render(ThemeSwitch, { theme: 'system', locale: 'en', save: async () => {} });
		const button = screen.getByRole('button');

		await expect.element(button).toHaveAccessibleName('Theme: Device');
		await button.click();
		await expect.element(button).toHaveAccessibleName('Theme: Day');
		expect(document.documentElement.dataset.theme).toBe('light');
		await button.click();
		await expect.element(button).toHaveAccessibleName('Theme: Night');
		expect(document.documentElement.dataset.theme).toBe('dark');
		await button.click();
		await expect.element(button).toHaveAccessibleName('Theme: Device');
		expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
	});

	it('saves each choice', async () => {
		const saved: string[] = [];
		const screen = render(ThemeSwitch, {
			theme: 'dark',
			locale: 'en',
			save: async (theme) => {
				saved.push(theme);
			}
		});

		await screen.getByRole('button').click();
		expect(saved).toEqual(['system']);
	});
});

describe('LanguageSwitch', () => {
	it('offers Arabic by its own name when the page is in English', async () => {
		const screen = render(LanguageSwitch, { locale: 'en' });

		const button = screen.getByRole('button');
		await expect.element(button).toHaveTextContent('العربية');
		await expect.element(button).toHaveAttribute('lang', 'ar');
	});

	it('offers English when the page is in Arabic', async () => {
		const screen = render(LanguageSwitch, { locale: 'ar' });

		await expect.element(screen.getByRole('button')).toHaveTextContent('English');
	});
});
