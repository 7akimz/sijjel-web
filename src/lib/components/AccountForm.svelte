<script lang="ts">
	import { untrack } from 'svelte';
	import { shownPhone } from '#lib/account.js';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, fieldText, type FieldErrors } from '#lib/api/errors.js';
	import type { Me } from '#lib/api/types.js';
	import { focusFirstInvalid } from '#lib/forms/focus.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, TextField } from '#lib/ui/index.js';

	type Props = { me: Me; onsaved: (me: Me) => void };
	let { me, onsaved }: Props = $props();

	const conflictFields: Record<string, string> = { phone_taken: 'phone', email_taken: 'email' };

	let displayName = $state(untrack(() => me.displayName));
	let phone = $state(untrack(() => shownPhone(me.phone)));
	let email = $state(untrack(() => me.email ?? ''));
	let errors = $state<FieldErrors>({});
	let failure = $state<string>();
	let saved = $state(false);
	let busy = $state(false);
	let formElement = $state<HTMLFormElement>();

	async function save(event: SubmitEvent) {
		event.preventDefault();
		saved = false;
		failure = undefined;
		errors = {};
		if (!displayName.trim()) errors.displayName = ['name_required'];
		if (!phone.trim()) errors.phone = ['phone_invalid'];
		if (Object.keys(errors).length > 0) return focusFirstInvalid(formElement);
		busy = true;
		try {
			const updated = await api<Me>('/me', {
				method: 'PUT',
				body: { displayName: displayName.trim(), phone: phone.trim(), email: email.trim() || null }
			});
			saved = true;
			onsaved(updated);
		} catch (e) {
			const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
			const field = conflictFields[error.code];
			errors = field ? { [field]: [error.code] } : error.fields;
			if (Object.keys(errors).length === 0) failure = errorText(error.code);
			else focusFirstInvalid(formElement);
		} finally {
			busy = false;
		}
	}
</script>

{#if saved}<Banner icon="check_circle">{m.account_saved()}</Banner>{/if}
{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}

<form method="post" class="sj-stack" bind:this={formElement} onsubmit={save} novalidate>
	<TextField
		label={m.field_display_name()}
		autocomplete="name"
		error={fieldText(errors, 'displayName')}
		bind:value={displayName}
	/>
	<TextField
		label={m.field_phone()}
		type="tel"
		autocomplete="tel"
		dir="ltr"
		required
		error={fieldText(errors, 'phone')}
		bind:value={phone}
	/>
	<TextField
		label={m.field_email_optional()}
		type="email"
		autocomplete="email"
		dir="ltr"
		error={fieldText(errors, 'email')}
		bind:value={email}
	/>
	<div>
		<Button type="submit" disabled={busy}>{m.action_save()}</Button>
	</div>
</form>
