import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { BoardDay } from '#lib/api/board-types.js';
import BoardDays from './BoardDays.svelte';

const days: BoardDay[] = [
	{ date: '2026-10-31', riders: 0 },
	{ date: '2026-11-01', riders: 3 },
	{ date: '2026-11-02', riders: 0 },
	{ date: '2026-11-03', riders: 1 },
	{ date: '2026-11-04', riders: 5 },
	{ date: '2026-11-05', riders: 0 },
	{ date: '2026-11-06', riders: 0 }
];

describe('BoardDays', () => {
	it('names the week and says how many riders each day has', async () => {
		const screen = render(BoardDays, { days, current: '2026-11-04', locale: 'en' });

		await expect.element(screen.getByText('31 Oct – 6 Nov')).toBeVisible();
		await expect
			.element(screen.getByRole('link', { name: 'Wed 4 Nov: 5 riders' }))
			.toHaveAttribute('aria-current', 'date');
		await expect.element(screen.getByRole('link', { name: 'Tue 3 Nov: 1 rider' })).toBeVisible();
		await expect.element(screen.getByRole('link', { name: 'Sat 31 Oct: No riders' })).toBeVisible();
	});

	it('moves a week back and forward from the shown day', async () => {
		const screen = render(BoardDays, { days, current: '2026-11-04', locale: 'en' });

		await expect
			.element(screen.getByRole('link', { name: 'Previous week' }))
			.toHaveAttribute('href', expect.stringContaining('date=2026-10-28'));
		await expect
			.element(screen.getByRole('link', { name: 'Next week' }))
			.toHaveAttribute('href', expect.stringContaining('date=2026-11-11'));
	});
});
