/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import {
	notificationOptions,
	openNotificationUrl,
	type PushMessage
} from '#lib/push/sw-handlers.js';

// Only shows session reminders and opens the board when one is tapped; nothing is cached.
const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('push', (event) => {
	const message = event.data?.json() as PushMessage | undefined;
	if (!message) return;
	event.waitUntil(sw.registration.showNotification(message.title, notificationOptions(message)));
});

// Taking control of open tabs at once lets a tapped reminder reuse them.
sw.addEventListener('activate', (event) => {
	event.waitUntil(sw.clients.claim());
});

sw.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = new URL(
		(event.notification.data as { url?: string })?.url ?? '/',
		sw.location.origin
	);
	event.waitUntil(
		openNotificationUrl(
			{
				matchAll: () => sw.clients.matchAll({ type: 'window', includeUncontrolled: true }),
				openWindow: (href) => sw.clients.openWindow(href)
			},
			sw.location.origin,
			url.href
		)
	);
});
