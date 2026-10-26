import type { CatalogueDiscipline } from './academy-types';

export interface PlanLevel {
	id: string;
	nameEn: string;
	nameAr: string;
	position: number;
}

export interface Plan {
	id: string;
	nameEn: string;
	nameAr: string;
	lessonsPerMonth: number;
	monthlyPrice: number;
	discipline: CatalogueDiscipline | null;
	/** Absent or empty when the plan covers every level of its discipline. */
	levels?: PlanLevel[];
	isActive: boolean;
}

export interface PlanInput {
	nameEn: string;
	nameAr: string;
	lessonsPerMonth: number;
	monthlyPrice: number;
	disciplineId: string | null;
	levelIds: string[];
	isActive: boolean;
}

export type HorseSource = 'school' | 'own';

export interface MemberLevel {
	id: string;
	nameEn: string;
	nameAr: string;
	position: number;
}

export interface Member {
	id: string;
	displayName: string;
	email: string;
	roles: ('admin' | 'trainer' | 'rider')[];
	status: 'active' | 'suspended';
	phone?: string | null;
	age: number | null;
	weightKg: number | null;
	discipline: CatalogueDiscipline | null;
	level: MemberLevel | null;
	plan: Plan | null;
	horseSource: HorseSource | null;
	privateHorse: { id: string; name: string; notes: string | null; isActive: boolean } | null;
	paidThisMonth?: boolean;
	upcomingBookings: number;
}

export interface RiderFieldsInput {
	age: number | null;
	weightKg: number | null;
	disciplineId: string | null;
	levelId: string | null;
	planId: string | null;
	horseSource: HorseSource | null;
}

export interface MemberInput extends RiderFieldsInput {
	displayName: string;
	roles: Member['roles'];
	phone: string | null;
}

export interface PendingInvite {
	id: string;
	role: 'admin' | 'trainer' | 'rider';
	name: string | null;
	phone: string | null;
	age: number | null;
	weightKg: number | null;
	discipline: { key: string; nameEn: string; nameAr: string } | null;
	level: { nameEn: string; nameAr: string } | null;
	plan: { nameEn: string; nameAr: string } | null;
	horseSource: HorseSource | null;
	expiresAt: string;
	createdAt: string;
}

export interface CreatedAcademyInvite {
	inviteId: string;
	token: string;
	url: string;
	expiresAt: string;
}

export interface SlotView {
	date: string;
	start: string;
	end: string;
	placesLeft: number;
	canBook: boolean;
	reason: string;
	suitableHorsesFree: number | null;
	suitableHorsesTotal: number | null;
	booked: boolean;
	bookingId: string | null;
}

export interface BookingView {
	id: string;
	date: string;
	start: string;
	end: string;
	startsAt: string;
	horseSource: HorseSource;
	ownHorseName: string | null;
	status: 'active' | 'cancelled';
	cancelledByAcademy: boolean;
	canCancel: boolean;
}

export interface PlanSummary {
	plan: Plan | null;
	currency: string;
	lessonsPerMonth: number;
	usedThisMonth: number;
	leftThisMonth: number;
	monthStart: string;
	monthEnd: string;
	paidThisMonth: boolean;
	unpaidBooking: 'allow' | 'block';
	horseSource: HorseSource;
	hasOwnHorse: boolean;
}

export interface AffectedBooking {
	id: string;
	riderName: string;
	date: string;
	startTime: string;
}
