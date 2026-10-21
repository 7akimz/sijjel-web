/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { notificationOptions, pickClient, type PushMessage } from '#lib/push/sw-handlers.js';

// Only shows session reminders and opens the board when one is tapped; nothing is cached.
const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('push', (event) => {
	const message = event.data?.json() as PushMessage | undefined;
	if (!message) return;
	event.waitUntil(sw.registration.showNotification(message.title, notificationOptions(message)));
});

sw.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = new URL(
		(event.notification.data as { url?: string })?.url ?? '/',
		sw.location.origin
	);
	event.waitUntil(
		(async () => {
			const windows = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });
			const open = pickClient(windows, sw.location.origin);
			if (open) {
				await open.navigate(url.href);
				await open.focus();
			} else {
				await sw.clients.openWindow(url.href);
			}
		})()
	);
});
