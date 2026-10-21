// The service worker's logic, kept free of service-worker globals so it can be tested.

export type PushMessage = { title: string; body: string; url: string; tag: string; lang: string };

export function notificationOptions(message: PushMessage): NotificationOptions & {
	data: { url: string };
} {
	return {
		body: message.body,
		tag: message.tag,
		lang: message.lang,
		dir: message.lang === 'ar' ? 'rtl' : 'ltr',
		icon: '/icons/icon-192.png',
		data: { url: message.url }
	};
}

type WindowLike = { url: string; focused: boolean };

// An open window of this site to reuse for a tapped notification, the focused one first.
export function pickClient<T extends WindowLike>(
	clients: readonly T[],
	origin: string
): T | undefined {
	const ours = clients.filter((c) => new URL(c.url).origin === origin);
	return ours.find((c) => c.focused) ?? ours[0];
}

type TabLike = WindowLike & {
	focus(): Promise<unknown>;
	navigate(url: string): Promise<unknown>;
};
type ClientsLike<T extends TabLike> = {
	matchAll(): Promise<readonly T[]>;
	openWindow(url: string): Promise<unknown>;
};

// Opens a tapped reminder's page, reusing a tab of the site when the worker controls it. A tab the
// worker doesn't control yet can't be navigated, so a new window opens instead.
export async function openNotificationUrl<T extends TabLike>(
	clients: ClientsLike<T>,
	origin: string,
	url: string
): Promise<void> {
	const tab = pickClient(await clients.matchAll(), origin);
	if (tab) {
		try {
			await tab.navigate(url);
			await tab.focus();
			return;
		} catch {
			// Fall through to a new window.
		}
	}
	await clients.openWindow(url);
}
