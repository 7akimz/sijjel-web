import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import OwnerInviteForm from './OwnerInviteForm.svelte';

const props = { academyId: 'a1', oncreated: () => {}, oncancel: () => {} };

describe('OwnerInviteForm', () => {
	it("asks for the owner's name, phone and email", async () => {
		const screen = render(OwnerInviteForm, props);

		await expect.element(screen.getByLabelText('Their name')).toBeVisible();
		await expect.element(screen.getByLabelText('Phone (optional)')).toBeVisible();
		await expect.element(screen.getByLabelText('Email (optional)')).toBeVisible();
		await expect
			.element(screen.getByText('The owner signs up with this number', { exact: false }))
			.toBeVisible();
	});

	it('needs a name before creating the invitation', async () => {
		const oncreated = vi.fn();
		const screen = render(OwnerInviteForm, { ...props, oncreated });

		await screen.getByRole('button', { name: 'Create invitation' }).click();

		await expect.element(screen.getByText('Enter a name.')).toBeVisible();
		await expect.element(screen.getByLabelText('Their name')).toHaveFocus();
		expect(oncreated).not.toHaveBeenCalled();
	});

	it('can be cancelled', async () => {
		const oncancel = vi.fn();
		const screen = render(OwnerInviteForm, { ...props, oncancel });

		await screen.getByRole('button', { name: 'Cancel' }).click();

		expect(oncancel).toHaveBeenCalledOnce();
	});
});
