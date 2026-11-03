import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Member } from '#lib/api/member-types.js';
import MemberLevel from './MemberLevel.svelte';
import {
	disciplines,
	flatwork,
	improver,
	jumping,
	layla,
	levelStep,
	plans
} from './level-fixtures';

type Call = { method: string; url: string };

function stubApi(respond: () => Response) {
	const calls: Call[] = [];
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string, init: RequestInit = {}) => {
			calls.push({ method: init.method ?? 'GET', url });
			return respond();
		})
	);
	return calls;
}

afterEach(() => vi.unstubAllGlobals());

const props = (member: Member, onchange = vi.fn()) => ({
	member,
	disciplines,
	plans,
	today: '2026-10-27',
	locale: 'en' as const,
	onchange
});

describe('MemberLevel', () => {
	it("shows the rider's level and the next one to move to", async () => {
		const screen = render(MemberLevel, props(layla));

		await expect.element(screen.getByText('Flatwork · Level 1')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Move to Level 2' })).toBeVisible();
	});

	it('shows no move button at the top of the ladder', async () => {
		const screen = render(MemberLevel, props({ ...layla, ...levelStep(flatwork, 'f3', 3) }));

		await expect.element(screen.getByText('Flatwork · Level 3')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: /^Move to/ })).not.toBeInTheDocument();
	});

	it('shows a coming move that staff can cancel', async () => {
		const coming = { ...layla, comingMove: { ...levelStep(jumping, 'j1', 1), from: '2026-11-01' } };
		const calls = stubApi(() => Response.json({ ...layla }));
		const onchange = vi.fn();
		const screen = render(MemberLevel, props(coming, onchange));

		await expect
			.element(screen.getByText('Moves to Show jumping · Level 1 on 1 Nov'))
			.toBeVisible();
		await screen.getByRole('button', { name: 'Cancel move' }).click();

		await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
		expect(calls).toEqual([{ method: 'DELETE', url: '/api/academy/members/m-layla/move' }]);
	});

	it('shows a coming plan that staff can cancel', async () => {
		const coming = { ...layla, comingPlan: { plan: improver, from: '2026-11-01' } };
		const calls = stubApi(() => Response.json({ ...layla }));
		const screen = render(MemberLevel, props(coming));

		await expect
			.element(screen.getByText('Plan changes to Improver, 8 a month on 1 Nov'))
			.toBeVisible();
		await screen.getByRole('button', { name: 'Cancel plan change' }).click();

		await vi.waitFor(() =>
			expect(calls).toEqual([{ method: 'DELETE', url: '/api/academy/members/m-layla/coming-plan' }])
		);
	});

	it('explains a refused plan cancel', async () => {
		const coming = { ...layla, comingPlan: { plan: improver, from: '2026-11-01' } };
		stubApi(() => Response.json({ code: 'plan_required' }, { status: 409 }));
		const screen = render(MemberLevel, props(coming));

		await screen.getByRole('button', { name: 'Cancel plan change' }).click();

		await expect
			.element(
				screen.getByText(
					"Their current plan doesn't suit the level they'll be on, so keep the new one."
				)
			)
			.toBeVisible();
	});

	it('lists the history newest first, ending where the rider started', async () => {
		const history = [
			{
				from: levelStep(flatwork, 'f1', 1),
				to: levelStep(flatwork, 'f2', 2),
				plan: null,
				startsOn: '2026-11-03',
				madeBy: 'Omar',
				madeAt: '2026-11-03T10:00:00Z'
			},
			...layla.levelHistory!
		];
		const screen = render(MemberLevel, props({ ...layla, levelHistory: history }));
		await expect.element(screen.getByText('Started at Level 1 · 1 Oct')).not.toBeVisible();
		await screen.getByText('History (2)').click();

		const items = screen
			.getByRole('listitem')
			.elements()
			.map((e) => e.textContent?.trim());
		expect(items).toEqual(['Level 1 → Level 2 · 3 Nov · Omar', 'Started at Level 1 · 1 Oct']);
	});

	it('opens the move form in place', async () => {
		const screen = render(MemberLevel, props(layla));

		await screen.getByRole('button', { name: 'Move to Level 2' }).click();

		await expect.element(screen.getByRole('radio', { name: 'From 1 November' })).toBeChecked();
		await screen.getByRole('button', { name: 'Cancel' }).click();
		await expect.element(screen.getByRole('button', { name: 'Move to Level 2' })).toBeVisible();
	});
});
