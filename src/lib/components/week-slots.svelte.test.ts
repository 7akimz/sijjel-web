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
});
