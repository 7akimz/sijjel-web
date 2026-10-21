import { describe, expect, it, vi } from 'vitest';
import { notificationOptions, openNotificationUrl, pickClient } from './sw-handlers';

describe('notificationOptions', () => {
	it('shows an Arabic reminder right to left and remembers where a tap goes', () => {
		expect(
			notificationOptions({
				title: 'انتهى الوقت',
				body: 'حصة 18:00 · Main arena · فارسان',
				url: '/board?date=2026-10-19',
				tag: 'session-2026-10-19-18:00',
				lang: 'ar'
			})
		).toMatchObject({
			body: 'حصة 18:00 · Main arena · فارسان',
			tag: 'session-2026-10-19-18:00',
			lang: 'ar',
			dir: 'rtl',
			data: { url: '/board?date=2026-10-19' }
		});
	});

	it('shows an English reminder left to right', () => {
		expect(
			notificationOptions({ title: "Time's up", body: '', url: '/board', tag: 't', lang: 'en' }).dir
		).toBe('ltr');
	});
});

describe('pickClient', () => {
	const client = (url: string, focused = false) => ({ url, focused });

	it('prefers an open window of the site, the focused one first', () => {
		const open = [
			client('https://alfaris.sijjel.app/'),
			client('https://alfaris.sijjel.app/board', true)
		];
		expect(pickClient(open, 'https://alfaris.sijjel.app')).toBe(open[1]);
	});

	it('finds nothing when no window of the site is open', () => {
		expect(
			pickClient([client('https://other.example/')], 'https://alfaris.sijjel.app')
		).toBeUndefined();
	});
});

describe('openNotificationUrl', () => {
	const origin = 'https://alfaris.sijjel.app';
	const url = `${origin}/board?date=2026-10-19`;

	it('opens a new window when the open tab is not controlled by the worker', async () => {
		const focus = vi.fn(async () => undefined);
		const tab = {
			url: `${origin}/reminders`,
			focused: true,
			focus,
			navigate: vi.fn(async () => {
				throw new TypeError('not controlled');
			})
		};
		const openWindow = vi.fn(async () => null);
		await openNotificationUrl({ matchAll: async () => [tab], openWindow }, origin, url);
		expect(openWindow).toHaveBeenCalledWith(url);
	});

	it('reuses a controlled tab', async () => {
		const focus = vi.fn(async () => undefined);
		const tab = { url: `${origin}/`, focused: false, focus, navigate: vi.fn(async () => null) };
		const openWindow = vi.fn(async () => null);
		await openNotificationUrl({ matchAll: async () => [tab], openWindow }, origin, url);
		expect(tab.navigate).toHaveBeenCalledWith(url);
		expect(focus).toHaveBeenCalled();
		expect(openWindow).not.toHaveBeenCalled();
	});
});
