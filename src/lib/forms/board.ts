import type {
	BoardArena,
	BoardRider,
	BoardSession,
	HorsePicker,
	PickerHorse
} from '#lib/api/board-types.js';
import type { Locale } from '#lib/api/types.js';
import { m } from '#lib/paraglide/messages.js';

type MessageFn = (inputs: object, options: { locale?: Locale }) => string;
const messages = m as unknown as Record<string, MessageFn | undefined>;

export type ArenaGroup = { arena: BoardArena | null; riders: BoardRider[] };

// Riders without an arena come first, since they are what staff still have to place.
export function groupByArena(session: BoardSession): ArenaGroup[] {
	const groups: ArenaGroup[] = session.arenas.map((arena) => ({
		arena,
		riders: session.riders.filter((r) => r.arenaId === arena.id)
	}));
	const unplaced = session.riders.filter(
		(r) => !session.arenas.some((arena) => arena.id === r.arenaId)
	);
	return unplaced.length > 0 ? [{ arena: null, riders: unplaced }, ...groups] : groups;
}

export function problemText(code: string, locale?: Locale): string {
	return (messages[`board_problem_${code}`] ?? messages.error_internal_error!)({}, { locale });
}

export function horseStateText(h: PickerHorse, locale?: Locale): string {
	switch (h.state) {
		case 'free':
			return '';
		case 'current':
			return m.board_horse_current({}, { locale });
		case 'taken':
			return m.board_horse_taken({ name: h.takenBy ?? '' }, { locale });
		case 'resting':
			return m.board_horse_resting({ used: h.usedToday, max: h.maxPerDay }, { locale });
		case 'unavailable':
			return m.board_horse_unavailable({}, { locale });
		case 'unsuitable':
			return m.board_horse_unsuitable({}, { locale });
	}
}

export function defaultArenaFor(picker: HorsePicker, session: BoardSession): string | null {
	const last = picker.history.find((ride) => ride.arenaId !== null);
	const arena = session.arenas.find((a) => a.id === last?.arenaId);
	return arena && arena.placesLeft > 0 ? arena.id : null;
}
