/**
 * trial_waiting is free days waiting for setup, as the platform sees it; the academy's own admins
 * see the same state as not_started.
 */
export type SubscriptionStatus =
	'no_package' | 'trial_waiting' | 'not_started' | 'free' | 'paid' | 'due_soon' | 'unpaid';

/** A tier academies pay sijjel for. A null rider limit is unlimited. */
export interface Package {
	id: string;
	nameEn: string;
	nameAr: string;
	maxRiders: number | null;
	monthlyPrice: number;
	isActive: boolean;
	/** Fixed when the package is made; its prices are in this country's currency. */
	country: string;
	currency: string;
}

export interface PackageInput {
	nameEn: string;
	nameAr: string;
	maxRiders: number | null;
	monthlyPrice: number;
	isActive: boolean;
	/** Read only when the package is made. */
	country?: string;
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
	first: boolean;
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
	/** The package's currency: every amount here, entries included, is in it. */
	currency: string;
	blocked: boolean;
	riders: Riders;
	entries: SubscriptionEntry[];
	/** Free days waiting for setup; platform only. */
	trialDaysWaiting?: number;
}

/** What an academy's admins are told about their subscription. */
export interface SubscriptionNotice {
	status: SubscriptionStatus;
	paidUntil: string | null;
	monthsUnpaid: number;
	amountUnpaid: number;
	currency: string;
	blocked: boolean;
}
