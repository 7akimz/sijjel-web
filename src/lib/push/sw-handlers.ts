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
