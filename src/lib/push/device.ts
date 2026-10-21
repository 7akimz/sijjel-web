import { api } from '#lib/api/client.js';
import type { Locale } from '#lib/api/types.js';

export type ReminderState = 'ios_install' | 'unsupported' | 'blocked' | 'off' | 'on';

export type DeviceEnv = {
	userAgent: string;
	standalone: boolean;
	hasPush: boolean;
	permission: NotificationPermission;
	subscribed: boolean;
};

// What the reminders page needs from the phone, so it can be faked in tests.
export type Device = {
	env(): Promise<DeviceEnv>;
	subscribe(publicKey: string, locale: Locale): Promise<void>;
	unsubscribe(): Promise<void>;
};

const isIOS = (ua: string) => /iPhone|iPad|iPod/.test(ua);
export const isAndroid = (ua: string) => /Android/.test(ua);

// An iPhone can only receive pushes from the home screen, so in the browser it gets the how-to
// even though Safari has a PushManager there.
export function detectState(env: DeviceEnv): ReminderState {
	if (isIOS(env.userAgent) && !env.standalone) return 'ios_install';
	if (!env.hasPush) return 'unsupported';
	if (env.permission === 'denied') return 'blocked';
	return env.subscribed ? 'on' : 'off';
}

export function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
	const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
	const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
	return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function hasPush() {
	return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

type ContainerLike<S> = {
	getRegistration(): Promise<{ pushManager: { getSubscription(): Promise<S | null> } } | undefined>;
};

// Uses getRegistration rather than `ready`, which never settles when the worker fails to register
// and would leave sign-out and the reminders page waiting forever.
export async function currentSubscription<S = PushSubscription>(
	container: ContainerLike<S> | null = hasPush()
		? (navigator.serviceWorker as unknown as ContainerLike<S>)
		: null
): Promise<S | null> {
	if (!container) return null;
	const registration = await container.getRegistration();
	return registration ? registration.pushManager.getSubscription() : null;
}

async function save(subscription: PushSubscription, locale: Locale) {
	const { endpoint, keys } = subscription.toJSON();
	await api('/push/subscriptions', { method: 'POST', body: { endpoint, keys, language: locale } });
}

export const browserDevice = (locale: Locale): Device => ({
	async env() {
		const subscription = await currentSubscription();
		// The server may have dropped this endpoint, so a subscription the browser still holds is
		// sent again before it counts as on.
		let subscribed = false;
		if (subscription) {
			subscribed = await save(subscription, locale).then(
				() => true,
				() => false
			);
		}
		return {
			userAgent: navigator.userAgent,
			standalone:
				window.matchMedia('(display-mode: standalone)').matches ||
				(navigator as Navigator & { standalone?: boolean }).standalone === true,
			hasPush: hasPush(),
			permission: typeof Notification === 'undefined' ? 'default' : Notification.permission,
			subscribed
		};
	},
	async subscribe(publicKey, language) {
		if ((await Notification.requestPermission()) !== 'granted') return;
		const registration = await navigator.serviceWorker.getRegistration();
		if (!registration) throw new Error('no service worker');
		const subscription =
			(await registration.pushManager.getSubscription()) ??
			(await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: keyBytes(publicKey)
			}));
		await save(subscription, language);
	},
	async unsubscribe() {
		const subscription = await currentSubscription();
		if (!subscription) return;
		await api('/push/subscriptions', {
			method: 'DELETE',
			body: { endpoint: subscription.endpoint }
		});
		await subscription.unsubscribe();
	}
});

type Unsubscribable = { endpoint: string; unsubscribe(): Promise<boolean> };

// forgetDevice stops this phone's reminders before signing out, so a shared phone doesn't keep
// getting the last trainer's. It never fails: signing out must still work offline.
export async function forgetDevice(
	find: () => Promise<Unsubscribable | null> = () => currentSubscription(),
	tell: (endpoint: string) => Promise<unknown> = (endpoint) =>
		api('/push/subscriptions', { method: 'DELETE', body: { endpoint } })
): Promise<void> {
	try {
		const subscription = await find();
		if (!subscription) return;
		await tell(subscription.endpoint).catch(() => {});
		await subscription.unsubscribe();
	} catch {
		return;
	}
}
