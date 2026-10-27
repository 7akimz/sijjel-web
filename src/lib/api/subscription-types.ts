export type SubscriptionStatus = 'no_package' | 'free' | 'paid' | 'due_soon' | 'unpaid';

/** A tier academies pay sijjel for. A null rider limit is unlimited. */
export interface Package {
	id: string;
	nameEn: string;
	nameAr: string;
	maxRiders: number | null;
	monthlyPrice: number;
	isActive: boolean;
}

export interface PackageInput {
	nameEn: string;
	nameAr: string;
	maxRiders: number | null;
	monthlyPrice: number;
	isActive: boolean;
}

export type PaymentMethod = 'instapay' | 'cash' | 'other';

export interface SubscriptionEntry {
	id: string;
	kind: 'paid' | 'free';
	amount: number | null;
	method: PaymentMethod | null;
	days: number | null;
	note: string | null;
	startsOn: string;
	endsOn: string;
	madeBy: string;
	madeAt: string;
}

/** Rider places in use against the package's limit, which is null when there is none. */
export interface Riders {
	count: number;
	limit: number | null;
}

export interface AcademySubscription {
	package: Package | null;
	status: SubscriptionStatus;
	paidUntil: string | null;
	monthsUnpaid: number;
	amountUnpaid: number;
	blocked: boolean;
	riders: Riders;
	entries: SubscriptionEntry[];
}

/** What an academy's admins are told about their subscription. */
export interface SubscriptionNotice {
	status: SubscriptionStatus;
	paidUntil: string | null;
	monthsUnpaid: number;
	amountUnpaid: number;
	blocked: boolean;
}
