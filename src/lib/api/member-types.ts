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

export interface LevelStep {
	discipline: CatalogueDiscipline;
	level: MemberLevel;
}

/** A move staff made that takes effect on `from`. */
export interface ComingMove extends LevelStep {
	from: string;
}

/** The plan a rider changes to on `from`, always the 1st of a month. */
export interface ComingPlan {
	plan: Plan;
	from: string;
}

/** One entry of a rider's level history; `from` is null where they started. */
export interface LevelChange {
	from: LevelStep | null;
	to: LevelStep;
	plan: Plan | null;
	startsOn: string;
	madeBy: string;
	madeAt: string;
}

export interface MoveInput {
	disciplineId: string;
	levelId: string;
	start: 'today' | 'next_month';
	planId?: string;
}

export interface Member {
	id: string;
	displayName: string;
	email: string | null;
	roles: ('admin' | 'trainer' | 'rider')[];
	status: 'active' | 'suspended' | 'left';
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
	comingMove: ComingMove | null;
	comingPlan: ComingPlan | null;
	/** Only on a single member and on a move's response. */
	levelHistory?: LevelChange[];
}

export interface RiderFieldsInput {
	disciplineId: string | null;
	levelId: string | null;
	planId: string | null;
	horseSource: HorseSource | null;
}

export interface MemberInput extends RiderFieldsInput {
	roles: Member['roles'];
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
	/** The recipient's phone in international digits, when the invite has one. */
	phone: string | null;
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
