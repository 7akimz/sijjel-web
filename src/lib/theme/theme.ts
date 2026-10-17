export type Theme = 'light' | 'dark' | 'system';

export const THEME_COOKIE = 'sijjel_theme';

export function themeFromCookie(value: string | undefined): Theme {
	return value === 'light' || value === 'dark' ? value : 'system';
}

export function themeAttr(theme: Theme): string {
	return theme === 'system' ? '' : `data-theme="${theme}"`;
}

export function nextTheme(theme: Theme): Theme {
	return theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
}
