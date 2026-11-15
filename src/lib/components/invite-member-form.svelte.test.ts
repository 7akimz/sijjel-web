import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import InviteMemberForm from './InviteMemberForm.svelte';

const props = {
	disciplines: { enabled: [], available: [] },
	plans: [],
	locale: 'en' as const,
	oncreated: () => {}
};

describe('InviteMemberForm', () => {
	it('invites a rider without asking who they are', async () => {
		const screen = render(InviteMemberForm, { ...props, kind: 'rider', ridersAllowed: true });

		await expect.element(screen.getByLabelText('Who are you inviting?')).not.toBeInTheDocument();
		await expect.element(screen.getByLabelText('Their name')).toBeVisible();
		await expect
			.element(screen.getByText('You can invite riders once opening hours', { exact: false }))
			.not.toBeInTheDocument();
	});

	it('holds riders back until setup is done', async () => {
		const screen = render(InviteMemberForm, { ...props, kind: 'rider', ridersAllowed: false });

		await expect
			.element(screen.getByText('You can invite riders once opening hours', { exact: false }))
			.toBeVisible();
		await expect.element(screen.getByLabelText('Their name')).not.toBeInTheDocument();
		await expect
			.element(screen.getByRole('button', { name: 'Create invitation' }))
			.not.toBeInTheDocument();
	});

	it("holds riders back at the package's rider limit", async () => {
		const screen = render(InviteMemberForm, {
			...props,
			kind: 'rider',
			ridersAllowed: true,
			riderLimitReached: true
		});

		await expect
			.element(screen.getByText("You've reached your package's rider limit.", { exact: false }))
			.toBeVisible();
		await expect.element(screen.getByLabelText('Their name')).not.toBeInTheDocument();
	});

	it('invites staff as a trainer or an admin, even before setup is done', async () => {
		const screen = render(InviteMemberForm, { ...props, kind: 'staff', ridersAllowed: false });

		const role = screen.getByLabelText('Who are you inviting?');
		await expect.element(role).toHaveValue('trainer');
		await expect.element(screen.getByRole('option', { name: 'An admin' })).toBeInTheDocument();
		await expect.element(screen.getByRole('option', { name: 'A rider' })).not.toBeInTheDocument();
		await expect.element(screen.getByLabelText('Discipline')).not.toBeInTheDocument();
		await expect
			.element(screen.getByText('You can invite riders once opening hours', { exact: false }))
			.not.toBeInTheDocument();
	});

	it('asks a rider for no age or weight', async () => {
		const screen = render(InviteMemberForm, { ...props, kind: 'rider', ridersAllowed: true });

		await expect.element(screen.getByLabelText('Age')).not.toBeInTheDocument();
		await expect.element(screen.getByLabelText(/Weight/)).not.toBeInTheDocument();
	});

	it("offers only plans that fit the rider's level", async () => {
		const dressage = { id: 'd', key: 'dressage', nameEn: 'Dressage', nameAr: 'ترويض' };
		const level = (id: string, position: number) => ({ id, nameEn: id, nameAr: id, position });
		const plan = (id: string, levels: ReturnType<typeof level>[]) => ({
			id,
			nameEn: id,
			nameAr: id,
			lessonsPerMonth: 8,
			monthlyPrice: 2200,
			discipline: dressage,
			levels,
			isActive: true
		});
		const screen = render(InviteMemberForm, {
			...props,
			kind: 'rider',
			ridersAllowed: true,
			disciplines: {
				enabled: [
					{
						...dressage,
						inUse: false,
						levels: [
							{ id: 'intro', nameEn: 'Intro', nameAr: 'تمهيدي', inUse: false },
							{ id: 'prelim', nameEn: 'Preliminary', nameAr: 'أولي', inUse: false }
						]
					}
				],
				available: []
			},
			plans: [plan('Beginner', [level('intro', 1)]), plan('Prelim plan', [level('prelim', 2)])]
		});

		await screen.getByLabelText('Plan').selectOptions('Beginner');
		await expect
			.element(screen.getByRole('option', { name: 'Prelim plan' }))
			.not.toBeInTheDocument();

		await screen.getByLabelText('Level').selectOptions('Preliminary');
		await expect.element(screen.getByLabelText('Plan')).toHaveValue('');
		await expect.element(screen.getByRole('option', { name: 'Prelim plan' })).toBeInTheDocument();
	});

	describe('when a discipline or level has no plan', () => {
		const dressage = { id: 'd', key: 'dressage', nameEn: 'Dressage', nameAr: 'ترويض' };
		const jumping = { id: 'j', key: 'show_jumping', nameEn: 'Show jumping', nameAr: 'قفز' };
		const ladder = [
			{ id: 'intro', nameEn: 'Intro', nameAr: 'تمهيدي', inUse: false },
			{ id: 'prelim', nameEn: 'Preliminary', nameAr: 'أولي', inUse: false }
		];
		const disciplines = {
			enabled: [
				{ ...jumping, inUse: false, levels: ladder },
				{ ...dressage, inUse: false, levels: ladder }
			],
			available: []
		};
		const prelimPlan = {
			id: 'p',
			nameEn: 'Prelim plan',
			nameAr: 'Prelim plan',
			lessonsPerMonth: 8,
			monthlyPrice: 2200,
			discipline: dressage,
			levels: [{ id: 'prelim', nameEn: 'Preliminary', nameAr: 'أولي', position: 2 }],
			isActive: true
		};

		it('starts on a discipline that has a plan', async () => {
			const screen = render(InviteMemberForm, {
				...props,
				kind: 'rider',
				ridersAllowed: true,
				disciplines,
				plans: [prelimPlan]
			});

			await expect.element(screen.getByLabelText('Discipline')).toHaveValue('d');
		});

		it('lets a discipline with no plan be chosen and links to adding one for it', async () => {
			const screen = render(InviteMemberForm, {
				...props,
				kind: 'rider',
				ridersAllowed: true,
				disciplines,
				plans: [prelimPlan]
			});
			const noPlan = screen.getByRole('option', { name: 'Show jumping (no plan yet)' });
			await expect.element(noPlan).not.toHaveAttribute('disabled');

			await screen.getByLabelText('Discipline').selectOptions('j');

			await expect.element(screen.getByText('No plan for Show jumping yet.')).toBeVisible();
			await expect
				.element(screen.getByRole('link', { name: 'Add a plan' }))
				.toHaveAttribute('href', '/settings/plans?from=invite&discipline=j');
		});

		it('says a level has no plan and links to adding one for the discipline', async () => {
			const screen = render(InviteMemberForm, {
				...props,
				kind: 'rider',
				ridersAllowed: true,
				disciplines,
				plans: [prelimPlan]
			});

			await expect.element(screen.getByText('No plan for Dressage, Intro yet.')).toBeVisible();
			await expect
				.element(screen.getByRole('link', { name: 'Add a plan' }))
				.toHaveAttribute('href', '/settings/plans?from=invite&discipline=d');

			await screen.getByLabelText('Level').selectOptions('Preliminary');
			await expect
				.element(screen.getByText('No plan for Dressage, Preliminary yet.'))
				.not.toBeInTheDocument();
		});

		it('links to adding a plan when the academy has none', async () => {
			const screen = render(InviteMemberForm, {
				...props,
				kind: 'rider',
				ridersAllowed: true,
				disciplines,
				plans: []
			});

			await expect
				.element(screen.getByRole('link', { name: 'Add a plan' }))
				.toHaveAttribute('href', '/settings/plans?from=invite');
		});
	});
});

describe('InviteMemberForm where staff book', () => {
	const dressage = { id: 'd', key: 'dressage', nameEn: 'Dressage', nameAr: 'ترويض' };
	const ready = {
		...props,
		kind: 'rider' as const,
		ridersAllowed: true,
		ridersBook: false,
		disciplines: {
			enabled: [
				{
					...dressage,
					inUse: false,
					levels: [{ id: 'intro', nameEn: 'Intro', nameAr: 'تمهيدي', inUse: false }]
				}
			],
			available: []
		},
		plans: [
			{
				id: 'p8',
				nameEn: 'Eight',
				nameAr: 'Eight',
				lessonsPerMonth: 8,
				monthlyPrice: 1000,
				discipline: dressage,
				levels: [],
				isActive: true
			}
		]
	};

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('adds the rider by name and phone, which it needs', async () => {
		const fetch = vi.fn(async () => Response.json({ id: 'm1' }, { status: 201 }));
		vi.stubGlobal('fetch', fetch);
		const onadded = vi.fn();
		const screen = render(InviteMemberForm, { ...ready, onadded });

		await screen.getByLabelText('Their name').fill('Layla Hassan');
		await screen.getByLabelText('Plan').selectOptions('Eight');
		await screen.getByRole('button', { name: 'Add rider' }).click();
		await expect.element(screen.getByText('Enter their phone number.')).toBeVisible();
		expect(fetch).not.toHaveBeenCalled();

		await screen.getByLabelText('Phone').fill('010 2345 6789');
		await screen.getByRole('button', { name: 'Add rider' }).click();

		await vi.waitFor(() => expect(onadded).toHaveBeenCalledWith('m1'));
		const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('/api/academy/riders');
		expect(JSON.parse(init.body as string)).toMatchObject({
			name: 'Layla Hassan',
			phone: '010 2345 6789',
			planId: 'p8'
		});
	});

	it('can still send an invite link instead', async () => {
		const fetch = vi.fn(async () =>
			Response.json(
				{ inviteId: 'i', token: 't', expiresAt: '2099-01-01T00:00:00Z', url: 'u', phone: null },
				{ status: 201 }
			)
		);
		vi.stubGlobal('fetch', fetch);
		const oncreated = vi.fn();
		const screen = render(InviteMemberForm, { ...ready, oncreated });

		await screen.getByLabelText('Their name').fill('Layla Hassan');
		await screen.getByLabelText('Plan').selectOptions('Eight');
		await screen.getByRole('button', { name: 'Send an invite link instead' }).click();

		await vi.waitFor(() => expect(oncreated).toHaveBeenCalled());
		expect((fetch.mock.calls[0] as unknown as [string])[0]).toBe('/api/academy/invites');
	});
});
