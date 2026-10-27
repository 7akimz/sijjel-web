import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import InviteMemberForm from './InviteMemberForm.svelte';

const props = {
	disciplines: { enabled: [], available: [] },
	plans: [],
	rules: {
		bookingWindowDays: 14,
		bookingClosesHours: 2,
		cancellationCutoffHours: 12,
		currency: 'EGP',
		unpaidBooking: 'allow' as const,
		minRiderAge: 6,
		maxRiderAge: null,
		countryCallingCode: '20',
		maxRiderWeightKg: null
	},
	locale: 'en' as const,
	oncreated: () => {}
};

describe('InviteMemberForm', () => {
	it('starts on a trainer and holds riders back until setup is done', async () => {
		const screen = render(InviteMemberForm, { ...props, ridersAllowed: false });

		await expect.element(screen.getByLabelText('Who are you inviting?')).toHaveValue('trainer');
		await expect
			.element(screen.getByRole('option', { name: 'A rider' }))
			.toHaveAttribute('disabled');
		await expect
			.element(screen.getByText('You can invite riders once opening hours', { exact: false }))
			.toBeVisible();
	});

	it("holds riders back at the package's rider limit", async () => {
		const screen = render(InviteMemberForm, {
			...props,
			ridersAllowed: true,
			riderLimitReached: true
		});

		await expect.element(screen.getByLabelText('Who are you inviting?')).toHaveValue('trainer');
		await expect
			.element(screen.getByRole('option', { name: 'A rider' }))
			.toHaveAttribute('disabled');
		await expect
			.element(screen.getByRole('option', { name: 'A trainer' }))
			.not.toHaveAttribute('disabled');
		await expect
			.element(screen.getByText("You've reached your package's rider limit.", { exact: false }))
			.toBeVisible();
	});

	it('starts on a rider once setup is done', async () => {
		const screen = render(InviteMemberForm, { ...props, ridersAllowed: true });

		await expect.element(screen.getByLabelText('Who are you inviting?')).toHaveValue('rider');
		await expect
			.element(screen.getByText('You can invite riders once opening hours', { exact: false }))
			.not.toBeInTheDocument();
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
});
