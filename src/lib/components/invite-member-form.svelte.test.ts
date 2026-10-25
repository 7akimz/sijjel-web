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

	it('starts on a rider once setup is done', async () => {
		const screen = render(InviteMemberForm, { ...props, ridersAllowed: true });

		await expect.element(screen.getByLabelText('Who are you inviting?')).toHaveValue('rider');
		await expect
			.element(screen.getByText('You can invite riders once opening hours', { exact: false }))
			.not.toBeInTheDocument();
	});
});
