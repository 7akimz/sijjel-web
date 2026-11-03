<script lang="ts">
	import { untrack } from 'svelte';
	import { api } from '#lib/api/client.js';
	import { ApiError, errorText, fieldText, type FieldErrors } from '#lib/api/errors.js';
	import type { Arena } from '#lib/api/academy-types.js';
	import { arenaErrors } from '#lib/forms/arena.js';
	import { focusFirstInvalid } from '#lib/forms/focus.js';
	import { m } from '#lib/paraglide/messages.js';
	import { Banner, Button, CheckboxField, TextField } from '#lib/ui/index.js';

	type Props = { arena?: Arena; onsaved: (arena: Arena) => void; oncancel?: () => void };
	let { arena, onsaved, oncancel }: Props = $props();

	const initial = untrack(() => arena);
	let name = $state(initial?.name ?? '');
	let capacity = $state<string | number>(initial?.capacity ?? '');
	let active = $state(initial?.isActive ?? true);
	let errors = $state<FieldErrors>({});
	let failure = $state<string>();
	let busy = $state(false);
	let formElement = $state<HTMLFormElement>();

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		failure = undefined;
		const body = { name: name.trim(), capacity: Number(capacity), isActive: active };
		errors = arenaErrors(body);
		if (Object.keys(errors).length > 0) return focusFirstInvalid(formElement);
		busy = true;
		try {
			const saved = initial
				? await api<Arena>(`/academy/arenas/${initial.id}`, { method: 'PUT', body })
				: await api<Arena>('/academy/arenas', { method: 'POST', body });
			if (!initial) {
				name = '';
				capacity = '';
			}
			onsaved(saved);
		} catch (e) {
			const error = e instanceof ApiError ? e : new ApiError(0, 'internal_error');
			errors = error.code === 'arena_name_taken' ? { name: [error.code] } : error.fields;
			if (Object.keys(errors).length === 0) failure = errorText(error.code);
			else focusFirstInvalid(formElement);
		} finally {
			busy = false;
		}
	}
</script>

<form method="post" class="sj-stack" bind:this={formElement} onsubmit={submit} novalidate>
	{#if failure}<Banner tone="danger" icon="error">{failure}</Banner>{/if}
	<div class="fields">
		<TextField
			label={m.arena_name()}
			error={fieldText(errors, 'name')}
			required
			bind:value={name}
		/>
		<TextField
			label={m.arena_capacity()}
			type="number"
			dir="ltr"
			error={fieldText(errors, 'capacity')}
			required
			bind:value={capacity}
		/>
	</div>
	{#if initial}<CheckboxField label={m.arena_active()} bind:checked={active} />{/if}
	<div class="sj-row">
		<Button type="submit" icon={initial ? undefined : 'add'} disabled={busy}>
			{initial ? m.action_save() : m.arena_add()}
		</Button>
		{#if oncancel}<Button variant="quiet" onclick={oncancel}>{m.action_cancel()}</Button>{/if}
	</div>
</form>

<style>
	.fields {
		display: grid;
		gap: var(--space-3);
	}
	@media (min-width: 720px) {
		.fields {
			grid-template-columns: 2fr 1fr;
		}
	}
</style>
