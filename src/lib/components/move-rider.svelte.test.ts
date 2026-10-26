import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MoveRider from './MoveRider.svelte';
import { disciplines, flatwork, layla, levelStep, plans } from './level-fixtures';

type Call = { method: string; url: string; body: unknown };

function stubApi(respond = () => Response.json({ ...layla })) {
	const calls: Call[] = [];
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string, init: RequestInit = {}) => {
			calls.push({
				method: init.method ?? 'GET',
				url,
				body: init.body ? JSON.parse(String(init.body)) : undefined
			});
			return respond();
		})
	);
	return calls;
}

afterEach(() => vi.unstubAllGlobals());

const props = {
	member: layla,
	disciplines,
	plans,
	today: '2026-10-27',
	locale: 'en' as const,
	onmoved: () => {},
	oncancel: () => {}
};

describe('MoveRider', () => {
	it('starts from the 1st of next month, with today as the other choice', async () => {
		const screen = render(MoveRider, {
			props: { ...props, target: { disciplineId: 'flat', levelId: 'f2' } }
		});

		await expect.element(screen.getByRole('radio', { name: 'From 1 November' })).toBeChecked();
		await expect.element(screen.getByRole('radio', { name: 'From today' })).not.toBeChecked();
	});

	it('sends no plan when the current one fits the new level', async () => {
		const calls = stubApi();
		const onmoved = vi.fn();
		const member = { ...layla, plan: { ...plans[2]!, levels: undefined } };
		const screen = render(MoveRider, {
			props: { ...props, member, onmoved, target: { disciplineId: 'flat', levelId: 'f2' } }
		});

		await expect.element(screen.getByLabelText('Plan')).not.toBeInTheDocument();
		await screen.getByRole('radio', { name: 'From today' }).click();
		await screen.getByRole('button', { name: 'Move' }).click();

		await vi.waitFor(() => expect(onmoved).toHaveBeenCalled());
		expect(calls).toEqual([
			{
				method: 'POST',
				url: '/api/academy/members/m-layla/move',
				body: { disciplineId: 'flat', levelId: 'f2', start: 'today' }
			}
		]);
	});

	it('asks for a plan that fits when the current one does not', async () => {
		const calls = stubApi();
		const screen = render(MoveRider, {
			props: { ...props, target: { disciplineId: 'flat', levelId: 'f2' } }
		});

		const options = screen.getByLabelText('Plan').getByRole('option');
		expect(options.elements().map((o) => o.textContent)).toEqual([
			'—',
			'Improver, 8 a month',
			'Any level, 8 a month'
		]);
		await screen.getByRole('button', { name: 'Move' }).click();
		await expect.element(screen.getByText('Pick a plan for this rider.')).toBeVisible();
		expect(calls).toHaveLength(0);

		await screen.getByLabelText('Plan').selectOptions('Improver, 8 a month');
		await screen.getByRole('button', { name: 'Move' }).click();
		await vi.waitFor(() => expect(calls).toHaveLength(1));
		expect(calls[0]!.body).toEqual({
			disciplineId: 'flat',
			levelId: 'f2',
			start: 'next_month',
			planId: 'p-improver'
		});
	});

	it('lets staff pick any taught discipline and level when changing level', async () => {
		const screen = render(MoveRider, {
			...props,
			member: { ...layla, ...levelStep(flatwork, 'f1', 1) }
		});

		const disciplineOptions = screen.getByLabelText('Discipline').getByRole('option');
		expect(disciplineOptions.elements().map((o) => o.textContent)).toEqual([
			'Flatwork',
			'Show jumping'
		]);
		await screen.getByLabelText('Discipline').selectOptions('Show jumping');
		const levelOptions = screen.getByLabelText('Level').getByRole('option');
		expect(levelOptions.elements().map((o) => o.textContent)).toEqual(['—', 'Level 1', 'Level 2']);
	});

	it('shows an error on a field the move form does not show', async () => {
		stubApi(() =>
			Response.json(
				{ code: 'validation_failed', errors: { levelId: ['level_unchanged'] } },
				{ status: 422 }
			)
		);
		const member = { ...layla, plan: { ...plans[2]!, levels: undefined } };
		const screen = render(MoveRider, {
			props: { ...props, member, target: { disciplineId: 'flat', levelId: 'f2' } }
		});

		await screen.getByRole('button', { name: 'Move' }).click();

		await expect.element(screen.getByText('The rider is already on this level.')).toBeVisible();
	});
});
