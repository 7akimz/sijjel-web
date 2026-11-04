import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { BoardTime } from '#lib/api/board-types.js';
import BoardTimes from './BoardTimes.svelte';

const time = (start: string, riders: number, hasProblem = false): BoardTime => ({
	start,
	end: '',
	riders,
	unplaced: 0,
	hasProblem
});

const times = [time('10:00', 0), time('16:00', 1), time('17:00', 5, true)];

describe('BoardTimes', () => {
	it('says how many riders each time has', async () => {
		const screen = render(BoardTimes, {
			times,
			date: '2026-11-04',
			current: '10:00',
			locale: 'en'
		});

		await expect.element(screen.getByRole('link', { name: '10:00 No riders' })).toBeVisible();
		await expect.element(screen.getByRole('link', { name: '16:00 1 rider' })).toBeVisible();
		await expect
			.element(screen.getByRole('link', { name: '17:00 Needs attention 5 riders' }))
			.toBeVisible();
	});

	it('marks the selected time', async () => {
		const screen = render(BoardTimes, {
			times,
			date: '2026-11-04',
			current: '16:00',
			locale: 'en'
		});

		await expect
			.element(screen.getByRole('link', { name: /^16:00/ }))
			.toHaveAttribute('aria-current', 'true');
		await expect
			.element(screen.getByRole('link', { name: /^10:00/ }))
			.not.toHaveAttribute('aria-current');
	});

	it('uses Arabic plural forms', async () => {
		const screen = render(BoardTimes, {
			times: [time('16:00', 2), time('17:00', 3), time('18:00', 11)],
			date: '2026-11-04',
			current: '16:00',
			locale: 'ar'
		});

		await expect.element(screen.getByRole('link', { name: '16:00 فارسان' })).toBeVisible();
		await expect.element(screen.getByRole('link', { name: '17:00 3 فرسان' })).toBeVisible();
		await expect.element(screen.getByRole('link', { name: '18:00 11 فارسًا' })).toBeVisible();
	});
});
