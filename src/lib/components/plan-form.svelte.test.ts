import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { AcademyDisciplines } from '#lib/api/academy-types.js';
import PlanForm from './PlanForm.svelte';

const level = (id: string, nameEn: string) => ({ id, nameEn, nameAr: nameEn, inUse: false });

const disciplines: AcademyDisciplines = {
	enabled: [
		{
			id: 'dressage',
			key: 'dressage',
			nameEn: 'Dressage',
			nameAr: 'ترويض',
			inUse: false,
			levels: [level('intro', 'Intro'), level('prelim', 'Preliminary')]
		},
		{
			id: 'jumping',
			key: 'show_jumping',
			nameEn: 'Show jumping',
			nameAr: 'قفز',
			inUse: false,
			levels: [level('poles', 'Poles')]
		}
	],
	available: []
};

function stubSave() {
	const bodies: Record<string, unknown>[] = [];
	vi.stubGlobal(
		'fetch',
		vi.fn(async (_url: string, init: RequestInit = {}) => {
			const body = JSON.parse(String(init.body));
			bodies.push(body);
			return Response.json({ id: 'p1', ...body, discipline: null, levels: [] }, { status: 201 });
		})
	);
	return bodies;
}

afterEach(() => vi.unstubAllGlobals());

async function fillNames(screen: ReturnType<typeof render>) {
	await screen.getByLabelText('Name (English)').fill('Beginner');
	await screen.getByLabelText('Name (Arabic)').fill('مبتدئ');
	await screen.getByLabelText('Monthly price').fill('2200');
}

describe('PlanForm', () => {
	it('shows level checkboxes for the chosen discipline', async () => {
		const bodies = stubSave();
		const screen = render(PlanForm, { disciplines, locale: 'en', onsaved: () => {} });
		await expect.element(screen.getByLabelText('Intro')).not.toBeInTheDocument();

		await fillNames(screen);
		await screen.getByLabelText('Discipline').selectOptions('Dressage');
		await screen.getByLabelText('Preliminary').click();
		await expect.element(screen.getByLabelText('Intro')).toBeVisible();
		await screen.getByRole('button', { name: 'Add plan' }).click();

		await vi.waitFor(() => expect(bodies).toHaveLength(1));
		expect(bodies[0]).toMatchObject({
			disciplineId: 'dressage',
			levelIds: ['prelim'],
			lessonsPerMonth: 8
		});
	});

	it('clears ticked levels when the discipline changes', async () => {
		const bodies = stubSave();
		const screen = render(PlanForm, { disciplines, locale: 'en', onsaved: () => {} });

		await fillNames(screen);
		await screen.getByLabelText('Discipline').selectOptions('Dressage');
		await screen.getByLabelText('Intro').click();
		await screen.getByLabelText('Discipline').selectOptions('Show jumping');
		await screen.getByRole('button', { name: 'Add plan' }).click();

		await vi.waitFor(() => expect(bodies).toHaveLength(1));
		expect(bodies[0]).toMatchObject({ disciplineId: 'jumping', levelIds: [] });
	});

	it('starts a new plan on the discipline it was opened for', async () => {
		const screen = render(PlanForm, {
			disciplines,
			locale: 'en',
			discipline: 'jumping',
			onsaved: () => {}
		});

		await expect.element(screen.getByLabelText('Discipline (optional)')).toHaveValue('jumping');
		await expect.element(screen.getByLabelText('Poles')).toBeVisible();
	});

	it('ignores a discipline the academy does not teach', async () => {
		const screen = render(PlanForm, {
			disciplines,
			locale: 'en',
			discipline: 'polo',
			onsaved: () => {}
		});

		await expect.element(screen.getByLabelText('Discipline (optional)')).toHaveValue('');
	});
});
