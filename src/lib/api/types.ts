import type { Package, Riders, SubscriptionNotice, SubscriptionStatus } from './subscription-types';

export type Locale = 'en' | 'ar';

export interface DisciplineRef {
	key: string;
	nameEn: string;
	nameAr: string;
}

export interface AcademyTenant {
	slug: string;
	nameEn: string;
	nameAr: string;
	defaultLanguage: Locale;
	timeZone: string;
	primaryColor: string;
	welcomeTextEn?: string | null;
	welcomeTextAr?: string | null;
	houseRulesEn?: string | null;
	houseRulesAr?: string | null;
	logoUrl?: string | null;
	coverUrl?: string | null;
	disciplines: DisciplineRef[];
}

export type Tenant =
	| { kind: 'platform' }
	| { kind: 'academy'; academy: AcademyTenant }
	| { kind: 'unknown' }
	| { kind: 'unavailable' };

export interface Me {
	id: string;
	phone: string | null;
	email: string | null;
	displayName: string;
	preferredLanguage: Locale | null;
	isPlatformAdmin: boolean;
}

export interface NameRef {
	nameEn: string;
	nameAr: string;
}

export interface Membership {
	roles: ('admin' | 'trainer' | 'rider')[];
	status: 'active' | 'suspended' | 'left';
	discipline: DisciplineRef | null;
	level: NameRef | null;
	setupDone: boolean;
	/** True while the platform has paused new bookings at the academy. */
	bookingPaused: boolean;
	/** Only for admins, and only when there is something to tell them. */
	subscription?: SubscriptionNotice;
}

export interface LevelName {
	nameEn: string;
	nameAr: string;
}

export interface Discipline {
	id: string;
	key: string;
	nameEn: string;
	nameAr: string;
	levels: LevelName[];
}

export interface AcademySummary {
	id: string;
	slug: string;
	nameEn: string;
	nameAr: string;
	isActive: boolean;
	disciplines: string[];
	ownerCount: number;
	package: Package | null;
	riders: Riders;
	status: SubscriptionStatus;
	paidUntil: string | null;
	monthsUnpaid: number;
	blocked: boolean;
}

export interface CreatedInvite {
	inviteId: string;
	token: string;
	expiresAt: string;
	url: string;
	/** The recipient's phone in international digits, when the invite has one. */
	phone: string | null;
}

export type Role = Membership['roles'][number];

export interface InvitePreview {
	academy: { slug: string; nameEn: string; nameAr: string };
	roles: Role[];
	discipline: DisciplineRef | null;
	level: NameRef | null;
	name: string | null;
	email: string | null;
	phone: string | null;
	phoneLocked: boolean;
	expiresAt: string;
}
