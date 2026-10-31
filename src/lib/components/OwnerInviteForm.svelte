<script lang="ts">
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, fieldText, type FieldErrors } from '#lib/api/errors.js';
	import type { CreatedInvite } from '#lib/api/types.js';
	import { focusFirstInvalid } from '#lib/forms/focus.js';
	import {
		ownerInviteErrors,
		toOwnerInviteRequest,
		type OwnerInviteForm
	} from '#lib/forms/owner-invite.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, TextField } from '#lib/ui/index.js';

	type Props = {
		academyId: string;
		oncreated: (invite: CreatedInvite, form: OwnerInviteForm) => void;
		oncancel: () => void;
	};
	let { academyId, oncreated, oncancel }: Props = $props();

	let form = $state<OwnerInviteForm>({ name: '', phone: '', email: '' });
	let errors = $state<FieldErrors>({});
	let failure = $state<string>();
	let busy = $state(false);
	let formElement = $state<HTMLFormElement>();

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		failure = undefined;
		errors = ownerInviteErrors(form);
		if (Object.keys(errors).length > 0) return focusFirstInvalid(formElement);
		busy = true;
		try {
			const created = await api<CreatedInvite>(`/platform/academies/${academyId}/owner-invites`, {
				method: 'POST',
				body: toOwnerInviteRequest(form)
			});
			oncreated(created, { ...form });
		} catch (e) {
			const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
			errors = error.fields;
			if (Object.keys(error.fields).length === 0) failure = errorText(error.code);
			else focusFirstInvalid(formElement);
		} finally {
			busy = false;
		}
	}
</script>

<form class="sj-stack" bind:this={formElement} onsubmit={submit} novalidate>
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
	<TextField
		label={m.invite_name()}
		autocomplete="off"
		error={fieldText(errors, 'name')}
		required
		bind:value={form.name}
	/>
	<TextField
		label={m.invite_phone()}
		type="tel"
		dir="ltr"
		hint={m.owner_invite_phone_hint()}
		error={fieldText(errors, 'phone')}
		bind:value={form.phone}
	/>
	<TextField
		label={m.field_email_optional()}
		type="email"
		dir="ltr"
		hint={m.owner_invite_email_hint()}
		error={fieldText(errors, 'email')}
		bind:value={form.email}
	/>
	<div class="sj-row">
		<Button type="submit" disabled={busy}>{m.invite_create()}</Button>
		<Button variant="quiet" onclick={oncancel}>{m.action_cancel()}</Button>
	</div>
</form>
