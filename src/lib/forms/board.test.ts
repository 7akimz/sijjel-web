import { describe, expect, it } from 'vitest';
import type { BoardSession, HorsePicker, PickerHorse } from '#lib/api/board-types.js';
import { defaultArenaFor, groupByArena, horseStateText, problemText, trainerGroups } from './board';

const rider = (name: string, arenaId: string | null) => ({
	bookingId: name,
	memberId: name,
	name,
	level: null,
	horseSource: 'school' as const,
	horse: null,
	ownHorseName: null,
	arenaId,
	note: null,
	problems: [],
	trainer: null as { id: string; name: string } | null
});

const session = (riders: ReturnType<typeof rider>[]): BoardSession => ({
	date: '2026-10-19',
	start: '18:00',
	end: '18:30',
	editable: true,
	times: [],
	arenas: [
		{ id: 'main', name: 'Main arena', capacity: 2, placesLeft: 0, trainer: null },
		{ id: 'side', name: 'Side arena', capacity: 2, placesLeft: 2, trainer: null }
	],
	staff: [],
	riders
});

const horse = (state: PickerHorse['state'], extra: Partial<PickerHorse> = {}): PickerHorse => ({
	id: 'h',
	name: 'Zahra',
	notes: null,
	state,
	takenBy: null,
	usedToday: 0,
	maxPerDay: 3,
	...extra
});

const pickerWith = (arenaIds: (string | null)[]): HorsePicker => ({
	rider: { memberId: 'm', name: 'Layla', level: null, weightKg: null },
	history: arenaIds.map((arenaId, i) => ({
		bookingId: `b${i}`,
		date: '2026-10-1' + i,
		start: '18:00',
		horseName: null,
		arenaId,
		arenaName: null,
		trainerName: null,
		note: null
	})),
	horses: []
});

describe('groupByArena', () => {
	it('puts riders without an arena first and keeps empty arenas', () => {
		const groups = groupByArena(session([rider('Layla', 'main'), rider('Sara', null)]));

		expect(groups.map((g) => g.arena?.id ?? null)).toEqual([null, 'main', 'side']);
		expect(groups[0].riders.map((r) => r.name)).toEqual(['Sara']);
		expect(groups[2].riders).toEqual([]);
	});

	it('leaves out the not-placed group when everyone has an arena', () => {
		expect(groupByArena(session([rider('Layla', 'main')])).map((g) => g.arena?.id)).toEqual([
			'main',
			'side'
		]);
	});
});

describe('horseStateText', () => {
	it("says why a horse is or isn't available", () => {
		expect(horseStateText(horse('free'), 'en')).toBe('');
		expect(horseStateText(horse('current'), 'en')).toBe('Current');
		expect(horseStateText(horse('taken', { takenBy: 'Layla' }), 'en')).toBe('With Layla');
		expect(horseStateText(horse('resting', { usedToday: 3 }), 'en')).toBe('Resting: 3 of 3 today');
		expect(horseStateText(horse('unavailable'), 'en')).toBe('Unavailable today');
		expect(horseStateText(horse('unsuitable'), 'en')).toBe('Not for this rider');
	});
});

describe('defaultArenaFor', () => {
	it("picks the last ride's arena while it has room", () => {
		expect(defaultArenaFor(pickerWith(['side', 'main']), session([]))).toBe('side');
		expect(defaultArenaFor(pickerWith([null, 'side']), session([]))).toBe('side');
		expect(defaultArenaFor(pickerWith(['main']), session([]))).toBeNull();
		expect(defaultArenaFor(pickerWith([]), session([]))).toBeNull();
	});
});

describe('problemText', () => {
	it('explains a problem in plain words', () => {
		expect(problemText('horse_unavailable', 'en')).toBe('This horse is unavailable today.');
	});
});

describe('trainerGroups', () => {
	const omar = { id: 'omar', name: 'Omar' };
	const ahmed = { id: 'ahmed', name: 'Ahmed' };
	const arena = (trainer: typeof omar | null) => ({
		id: 'main',
		name: 'Main arena',
		capacity: 4,
		placesLeft: 0,
		trainer
	});
	const withTrainer = (name: string, trainer: typeof omar | null) => ({
		...rider(name, 'main'),
		trainer
	});
	const summary = (groups: ReturnType<typeof trainerGroups>) =>
		groups.map((g) => [g.trainer?.name ?? null, g.riders.map((r) => r.name)]);

	it('keeps one group when every rider follows one trainer', () => {
		expect(
			summary(trainerGroups(arena(omar), [withTrainer('Layla', null), withTrainer('Sara', null)]))
		).toEqual([['Omar', ['Layla', 'Sara']]]);
	});

	it('splits riders with their own trainer from those following the arena', () => {
		expect(
			summary(
				trainerGroups(arena(omar), [
					withTrainer('Layla', null),
					withTrainer('Nour', ahmed),
					withTrainer('Sara', null)
				])
			)
		).toEqual([
			['Omar', ['Layla', 'Sara']],
			['Ahmed', ['Nour']]
		]);
	});

	it('lists riders with no trainer last', () => {
		expect(
			summary(trainerGroups(arena(null), [withTrainer('Layla', null), withTrainer('Nour', ahmed)]))
		).toEqual([
			['Ahmed', ['Nour']],
			[null, ['Layla']]
		]);
	});

	it('keeps one group with no trainer when nobody is assigned', () => {
		expect(
			summary(trainerGroups(arena(null), [withTrainer('Layla', null), withTrainer('Sara', null)]))
		).toEqual([[null, ['Layla', 'Sara']]]);
	});
});
