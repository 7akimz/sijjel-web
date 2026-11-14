import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Device, DeviceEnv } from '#lib/push/device.js';
import RemindersPanel from './RemindersPanel.svelte';

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
	const device: Device & {
		subscribe: ReturnType<typeof vi.fn>;
		unsubscribe: ReturnType<typeof vi.fn>;
	} = {
		env: async () => ({ ...state }),
		subscribe: vi.fn(async () => {
			state.permission = 'granted';
			state.subscribed = true;
		}),
		unsubscribe: vi.fn(async () => {
			state.subscribed = false;
		})
	};
	return device;
}

afterEach(() => vi.unstubAllGlobals());

describe('RemindersPanel', () => {
	it('shows the home screen how-to on an iPhone browser and no button', async () => {
		const screen = render(RemindersPanel, {
			publicKey: 'key',
			locale: 'en',
			device: fakeDevice({ userAgent: iphone })
		});
		await expect.element(screen.getByText(/Add to Home Screen/)).toBeVisible();
		await expect
			.element(screen.getByRole('button', { name: 'Turn on reminders' }))
			.not.toBeInTheDocument();
	});

	it('explains blocked notifications', async () => {
		const screen = render(RemindersPanel, {
			publicKey: 'key',
			locale: 'en',
			device: fakeDevice({ permission: 'denied' })
		});
		await expect.element(screen.getByText(/Notifications are blocked/)).toBeVisible();
	});

	it('turns on in Arabic, then shows the battery tip on Android', async () => {
		const device = fakeDevice();
		const screen = render(RemindersPanel, { publicKey: 'key', locale: 'ar', device });

		await screen.getByRole('button', { name: 'تفعيل التنبيهات' }).click();

		expect(device.subscribe).toHaveBeenCalledWith('key', 'ar');
		await expect.element(screen.getByText('التنبيهات مفعّلة على هذا الهاتف.')).toBeVisible();
		await expect.element(screen.getByText(/تحسين البطارية/)).toBeVisible();
	});

	it('sends a test and turns off', async () => {
		const calls: string[] = [];
		vi.stubGlobal(
			'fetch',
			vi.fn(async (url: string) => {
				calls.push(url);
				return Response.json({ sent: 1 });
			})
		);
		const device = fakeDevice({ permission: 'granted', subscribed: true });
		const screen = render(RemindersPanel, { publicKey: 'key', locale: 'en', device });

		await screen.getByRole('button', { name: 'Send a test' }).click();
		await expect.element(screen.getByText(/Test sent/)).toBeVisible();
		expect(calls).toEqual(['/api/push/test']);

		await screen.getByRole('button', { name: 'Turn off' }).click();
		expect(device.unsubscribe).toHaveBeenCalled();
		await expect.element(screen.getByRole('button', { name: 'Turn on reminders' })).toBeVisible();
	});

	it('says reminders are off for this server without a key', async () => {
		const screen = render(RemindersPanel, { publicKey: null, locale: 'en', device: fakeDevice() });
		await expect.element(screen.getByText(/aren't switched on for this server/)).toBeVisible();
	});

	it('says so when the test reached no device', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => Response.json({ sent: 0 }))
		);
		const screen = render(RemindersPanel, {
			publicKey: 'key',
			locale: 'en',
			device: fakeDevice({ permission: 'granted', subscribed: true })
		});
		await screen.getByRole('button', { name: 'Send a test' }).click();
		await expect.element(screen.getByText(/couldn't reach this phone/)).toBeVisible();
		await expect.element(screen.getByText(/Test sent/)).not.toBeInTheDocument();
	});

	it('speaks to riders about cancellations', async () => {
		const device = fakeDevice();
		const screen = render(RemindersPanel, {
			publicKey: 'key',
			locale: 'en',
			device,
			audience: 'rider'
		});
		await expect
			.element(screen.getByText('Get notifications on this phone when your sessions change.'))
			.toBeVisible();
		await screen.getByRole('button', { name: 'Turn on notifications' }).click();
		await expect.element(screen.getByText('Notifications are on for this phone.')).toBeVisible();
	});
});
