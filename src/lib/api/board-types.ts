import type { HorseSource } from '#lib/api/member-types.js';
import type { NameRef } from '#lib/api/types.js';

export interface NamedRef {
	id: string;
	name: string;
}

export interface BoardTime {
	start: string;
	end: string;
	riders: number;
	/** Riders not yet placed in an arena. */
	unplaced: number;
	hasProblem: boolean;
}

export interface BoardArena {
	id: string;
	name: string;
	capacity: number;
	placesLeft: number;
	trainer: NamedRef | null;
}

export type BoardProblem =
	'horse_unavailable' | 'horse_unsuitable' | 'arena_full' | 'arena_inactive' | 'no_workable_horse';

export interface BoardRider {
	bookingId: string;
	memberId: string;
	name: string;
	level: NameRef | null;
	horseSource: HorseSource;
	horse: NamedRef | null;
	ownHorseName: string | null;
	arenaId: string | null;
	note: string | null;
	problems: BoardProblem[];
	/** The rider's own trainer; null when they follow the arena's trainer. */
	trainer: NamedRef | null;
}

export interface BoardSession {
	date: string;
	start: string;
	end: string;
	editable: boolean;
	times: BoardTime[];
	arenas: BoardArena[];
	staff: NamedRef[];
	riders: BoardRider[];
}

export interface Ride {
	bookingId: string;
	date: string;
	start: string;
	horseName: string | null;
	arenaId: string | null;
	arenaName: string | null;
	trainerName: string | null;
	note: string | null;
}

export type HorseState = 'free' | 'current' | 'taken' | 'resting' | 'unavailable' | 'unsuitable';

export interface PickerHorse {
	id: string;
	name: string;
	notes: string | null;
	state: HorseState;
	takenBy: string | null;
	usedToday: number;
	maxPerDay: number;
}

export interface HorsePicker {
	rider: { memberId: string; name: string; level: NameRef | null };
	history: Ride[];
	horses: PickerHorse[];
}

export interface PlacementResult {
	session: BoardSession;
	unplaceable: string[];
}
