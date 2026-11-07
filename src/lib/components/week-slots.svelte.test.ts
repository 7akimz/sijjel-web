import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { SlotView } from '#lib/api/member-types.js';
import WeekSlots from './WeekSlots.svelte';

const slot = (date: string, start: string): SlotView => ({
	date,
	start,
	end: start,
	placesLeft: 3,
	canBook: true,
	reason: '',
	suitableHorsesFree: 2,
	suitableHorsesTotal: 2,
	booked: false,
	bookingId: null
});

const props = (
	slots: SlotView[],
	week: string,
	onbook: (s: SlotView, confirm: boolean) => Promise<string[] | null>
) => ({
	slots,
	week,
	firstWeek: '2026-10-17',
	school: true,
	busy: false,
	locale: 'en' as const,
	weekHref: (w: string) => `/book?week=${w}`,
	confirmText: (s: SlotView) => `Book ${s.date} ${s.start}?`,
	onbook
});

describe('WeekSlots', () => {
	it('shows staff warnings under the slot and books that slot anyway', async () => {
		const onbook = vi.fn(async (_s: SlotView, confirm: boolean) =>
			confirm ? null : ['Weekly limit reached']
		);
		const screen = render(
			WeekSlots,
			props([slot('2026-10-21', '18:00'), slot('2026-10-21', '18:30')], '2026-10-17', onbook)
		);

		await screen.getByRole('button', { name: 'Book', exact: true }).nth(1).click();
		await screen.getByRole('button', { name: 'Yes, book it' }).click();

		const confirm = screen.getByRole('group', { name: 'Book 2026-10-21 18:30?' });
		await expect.element(confirm.getByText('Weekly limit reached')).toBeVisible();
		await confirm.getByRole('button', { name: 'Book anyway' }).click();
		expect(onbook).toHaveBeenLastCalledWith(expect.objectContaining({ start: '18:30' }), true);
	});

	it('drops a pending warning when the week changes', async () => {
		const onbook = vi.fn(async () => ['Weekly limit reached']);
		const screen = render(WeekSlots, props([slot('2026-10-21', '18:00')], '2026-10-17', onbook));
		await screen.getByRole('button', { name: 'Book', exact: true }).click();
		await screen.getByRole('button', { name: 'Yes, book it' }).click();
		await expect.element(screen.getByRole('button', { name: 'Book anyway' })).toBeVisible();

		await screen.rerender(props([slot('2026-10-28', '18:00')], '2026-10-24', onbook));

		await expect
			.element(screen.getByRole('button', { name: 'Book anyway' }))
			.not.toBeInTheDocument();
	});

	it('leaves out week paging when every bookable day fits on one page', async () => {
		const screen = render(WeekSlots, {
			...props([slot('2026-11-07', '18:00')], '2026-11-07', vi.fn()),
			firstWeek: '2026-11-07',
			end: '2026-11-09',
			last: '2026-11-09'
		});

		await expect.element(screen.getByText('Saturday · 7 November 2026')).toBeVisible();
		await expect.element(screen.getByRole('navigation')).not.toBeInTheDocument();
	});

	it('stops paging at the last bookable day and names a one-day page by its date', async () => {
		const screen = render(WeekSlots, {
			...props([slot('2026-11-21', '18:00')], '2026-11-21', vi.fn()),
			firstWeek: '2026-11-07',
			end: '2026-11-21',
			last: '2026-11-21'
		});

		await expect
			.element(screen.getByRole('link', { name: 'Previous week' }))
			.toHaveAttribute('href', '/book?week=2026-11-14');
		await expect.element(screen.getByRole('link', { name: 'Next week' })).not.toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: 'Next week' })).toBeDisabled();
		await expect.element(screen.getByText('21 November 2026', { exact: true })).toBeVisible();
	});

	it('says why the page is empty in the words it is given', async () => {
		const screen = render(WeekSlots, {
			...props([], '2026-11-07', vi.fn()),
			empty: 'No sessions open for booking right now.'
		});

		await expect
			.element(screen.getByRole('heading', { name: 'No sessions open for booking right now.' }))
			.toBeVisible();
	});

	it('shows riders no counts or warnings, only the time and Book', async () => {
		const plain = {
			...slot('2026-11-07', '18:00'),
			placesLeft: null,
			suitableHorsesFree: null,
			suitableHorsesTotal: null
		};
		const later = { ...plain, start: '18:30' };
		const screen = render(WeekSlots, {
			...props([plain, later], '2026-11-07', vi.fn()),
			counts: false
		});

		expect(screen.getByRole('button', { name: 'Book', exact: true }).elements()).toHaveLength(2);
		expect(screen.container.querySelector('.sj-slot__body')?.textContent?.trim()).toBe('');
	});
});
