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
		interface PageData {
			/** The navigation item to mark as current when the page sits outside its section's path. */
			navPath?: string;
		}
		interface PageState {
			/** A message the next page shows once, such as after saving on another page. */
			notice?: string;
		}
	}
}

export {};
