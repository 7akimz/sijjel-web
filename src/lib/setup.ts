import { resolve } from '$app/paths';
import type { SetupStep } from '#lib/forms/setup.js';

// The ?setup marker tells a step's page the owner came from the checklist, so it offers the next step once saved.
export function setupHref(step: SetupStep): string {
	switch (step) {
		case 'hours':
			return resolve('/(academy)/(admin)/settings/hours?setup');
		case 'arenas':
			return resolve('/(academy)/(admin)/settings/arenas?setup');
		case 'horses':
			return resolve('/(academy)/(admin)/horses/new?setup');
	}
}
