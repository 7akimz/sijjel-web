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
	primaryColor: string;
	welcomeTextEn?: string | null;
	welcomeTextAr?: string | null;
	houseRulesEn?: string | null;
	houseRulesAr?: string | null;
	disciplines: DisciplineRef[];
}

export type Tenant =
	| { kind: 'platform' }
	| { kind: 'academy'; academy: AcademyTenant }
	| { kind: 'unknown' }
	| { kind: 'unavailable' };

export interface Me {
	id: string;
	email: string;
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
	status: 'active' | 'suspended';
	discipline: DisciplineRef | null;
	level: NameRef | null;
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
}

export interface CreatedInvite {
	inviteId: string;
	token: string;
	expiresAt: string;
	url: string;
}

export type Role = Membership['roles'][number];

export interface InvitePreview {
	academy: { slug: string; nameEn: string; nameAr: string };
	roles: Role[];
	discipline: DisciplineRef | null;
	level: NameRef | null;
	name: string | null;
	email: string | null;
	expiresAt: string;
}
