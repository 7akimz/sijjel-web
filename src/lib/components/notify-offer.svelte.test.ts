import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Device, DeviceEnv } from '#lib/push/device.js';
import NotifyOffer from './NotifyOffer.svelte';

const android =
	'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const iphone =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

function fakeDevice(env: Partial<DeviceEnv> = {}) {
	const state: DeviceEnv = {
		userAgent: android,
		standalone: false,
		hasPush: true,
		permission: 'default',
		subscribed: false,
		...env
	};
	return {
		env: async () => ({ ...state }),
		subscribe: vi.fn(async () => {
			state.permission = 'granted';
			state.subscribed = true;
		}),
		unsubscribe: vi.fn(async () => {
			state.subscribed = false;
		})
	} satisfies Device;
}

const question = 'Want to hear about changes like this straight away?';

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('NotifyOffer', () => {
	it('turns notifications on and then goes away', async () => {
		const device = fakeDevice();
		const screen = render(NotifyOffer, { publicKey: 'key', locale: 'en', device });
		await screen.getByRole('button', { name: 'Turn on notifications' }).click();

		expect(device.subscribe).toHaveBeenCalledWith('key', 'en');
		await expect.element(screen.getByText(question)).not.toBeInTheDocument();
	});

	it('stays hidden on this device after Not now', async () => {
		const first = render(NotifyOffer, { publicKey: 'key', locale: 'en', device: fakeDevice() });
		await first.getByRole('button', { name: 'Not now' }).click();
		await expect.element(first.getByText(question)).not.toBeInTheDocument();
		first.unmount();

		const again = render(NotifyOffer, { publicKey: 'key', locale: 'en', device: fakeDevice() });
		await new Promise((r) => setTimeout(r, 50));
		await expect.element(again.getByText(question)).not.toBeInTheDocument();
	});

	it('sends an iPhone in the browser to the account page for the how-to', async () => {
		const screen = render(NotifyOffer, {
			publicKey: 'key',
			locale: 'en',
			device: fakeDevice({ userAgent: iphone })
		});
		await expect
			.element(screen.getByRole('link', { name: 'How to turn on' }))
			.toHaveAttribute('href', '/account');
		await expect
			.element(screen.getByRole('button', { name: 'Turn on notifications' }))
			.not.toBeInTheDocument();
	});

	it.each([
		['on', { subscribed: true, permission: 'granted' as const }],
		['blocked', { permission: 'denied' as const }],
		['unsupported', { hasPush: false }]
	])('shows nothing when notifications are %s', async (_name, env) => {
		const screen = render(NotifyOffer, { publicKey: 'key', locale: 'en', device: fakeDevice(env) });
		await new Promise((r) => setTimeout(r, 50));
		await expect.element(screen.getByText(question)).not.toBeInTheDocument();
	});

	it('shows nothing when the server has no push key', async () => {
		const screen = render(NotifyOffer, { publicKey: null, locale: 'en', device: fakeDevice() });
		await new Promise((r) => setTimeout(r, 50));
		await expect.element(screen.getByText(question)).not.toBeInTheDocument();
	});
});
