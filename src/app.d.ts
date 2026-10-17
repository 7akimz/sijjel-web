import type { Locale, Me, Membership, Tenant } from '#lib/api/types.js';
import type { Theme } from '#lib/theme/theme.js';

declare global {
	namespace App {
		interface Locals {
			tenant: Tenant;
			user: Me | null;
			membership: Membership | null;
			theme: Theme;
			locale: Locale;
		}
	}
}

export {};
