export interface StepState {
	done: boolean;
}

export interface SetupState {
	hours: StepState;
	arenas: StepState;
	horses: StepState;
	plans: StepState;
}

export interface ScheduleDay {
	weekday: number;
	opensAt: string;
	closesAt: string;
}

export interface ScheduleInput {
	timeZone: string;
	sessionLengthMinutes: number;
	breakMinutes: number;
	days: ScheduleDay[];
}

export interface DayPreview {
	weekday: number;
	starts: string[];
}

export interface Schedule extends ScheduleInput {
	preview: DayPreview[];
}

export interface BookingRules {
	bookingWindowDays: number;
	bookingClosesHours: number;
	cancellationCutoffHours: number;
	currency: string;
	unpaidBooking: 'allow' | 'block';
	countryCallingCode: string;
}

export interface Arena {
	id: string;
	name: string;
	capacity: number;
	isActive: boolean;
}

export interface ClosedRange {
	id: string;
	from: string;
	to: string;
	reason: string | null;
}

export interface AcademyLevel {
	id: string;
	nameEn: string;
	nameAr: string;
	inUse: boolean;
}

export interface AcademyDiscipline {
	id: string;
	key: string;
	nameEn: string;
	nameAr: string;
	inUse: boolean;
	levels: AcademyLevel[];
}

export interface CatalogueDiscipline {
	id: string;
	key: string;
	nameEn: string;
	nameAr: string;
}

export interface AcademyDisciplines {
	enabled: AcademyDiscipline[];
	available: CatalogueDiscipline[];
}

export interface HorseLevel {
	id: string;
	nameEn: string;
	nameAr: string;
	position: number;
}

export type Unavailable = ClosedRange;

export interface Horse {
	id: string;
	name: string;
	kind: 'school';
	discipline: CatalogueDiscipline;
	minLevel: HorseLevel;
	maxLevel: HorseLevel;
	maxSessionsPerDay: number;
	notes: string | null;
	isActive: boolean;
	unavailableToday: boolean;
	unavailability: Unavailable[];
	/** Rides that have started today and in the 6 days before. */
	lastWeekSessions: number;
}

export interface HorseRide {
	bookingId: string;
	memberId: string;
	riderName: string;
	start: string;
	arenaName: string | null;
	trainerName: string | null;
	note: string | null;
}

export interface HorseRideDay {
	date: string;
	rides: HorseRide[];
}

export interface HorseLoad {
	sessions: number;
	/** Days that reached the horse's daily limit. */
	fullDays: number;
}

export interface HorseRides {
	/** Null for a horse with no daily limit. */
	maxPerDay: number | null;
	lastWeek: HorseLoad;
	days: HorseRideDay[];
	/** The date to ask for older rides with, or null when there are none. */
	before: string | null;
}

export interface HorseInput {
	name: string;
	disciplineId: string;
	minLevelId: string;
	maxLevelId: string;
	maxSessionsPerDay: number;
	notes: string | null;
	isActive: boolean;
}
