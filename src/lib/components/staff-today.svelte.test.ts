import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { BoardSession } from '#lib/api/board-types.js';
import StaffToday from './StaffToday.svelte';

const board = (times: BoardSession['times']): BoardSession => ({
	date: '2026-10-25',
	start: '18:00',
	end: '18:30',
	editable: true,
	times,
	days: [],
	arenas: [],
	staff: [],
	riders: []
});

const busy = board([
	{ start: '17:30', end: '18:00', riders: 0, unplaced: 0, hasProblem: false },
	{ start: '18:00', end: '18:30', riders: 3, unplaced: 1, hasProblem: true },
	{ start: '18:30', end: '19:00', riders: 2, unplaced: 0, hasProblem: false }
]);

describe('StaffToday', () => {
	it("sums up today's sessions and links each one to the board", async () => {
		const screen = render(StaffToday, { board: busy, setupDone: true, admin: true });

		await expect.element(screen.getByText('Sessions').first()).toBeVisible();
		await expect.element(screen.getByTestId('today-riders')).toHaveTextContent('5');
		await expect.element(screen.getByTestId('today-unplaced')).toHaveTextContent('1');
		await expect.element(screen.getByText('Sessions with a problem: 1')).toBeVisible();
		await expect
			.element(screen.getByRole('link', { name: /18:00/ }))
			.toHaveAttribute('href', expect.stringMatching(/\/board\?date=2026-10-25&start=18:00$/));
		await expect.element(screen.getByRole('link', { name: /17:30/ })).not.toBeInTheDocument();
		await expect.element(screen.getByRole('link', { name: 'Open the board' })).toBeVisible();
		await expect.element(screen.getByRole('link', { name: 'Invite rider' })).toBeVisible();
	});

	it('says so when nobody is booked today, and gives trainers no invite button', async () => {
		const screen = render(StaffToday, {
			board: board([{ start: '18:00', end: '18:30', riders: 0, unplaced: 0, hasProblem: false }]),
			setupDone: true,
			admin: false
		});

		await expect.element(screen.getByText('No riders booked today.')).toBeVisible();
		await expect.element(screen.getByRole('link', { name: 'Open the board' })).toBeVisible();
		await expect
			.element(screen.getByRole('link', { name: 'Invite rider' }))
			.not.toBeInTheDocument();
	});

	it('tells a trainer the academy is still being set up', async () => {
		const screen = render(StaffToday, { board: null, setupDone: false, admin: false });

		await expect.element(screen.getByText('Your academy is still being set up')).toBeVisible();
		await expect
			.element(screen.getByRole('link', { name: 'Open the board' }))
			.not.toBeInTheDocument();
	});

	it('shows an owner nothing extra during setup, since the checklist is above', () => {
		const { container } = render(StaffToday, { board: null, setupDone: false, admin: true });

		expect(container.textContent?.trim()).toBe('');
	});
});
