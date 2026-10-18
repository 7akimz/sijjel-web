<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { normalizeTime } from '#lib/time.js';
	import Icon from './Icon.svelte';

	type Props = { label: string; opens?: string; closes?: string; error?: string };
	let { label, opens = $bindable(''), closes = $bindable(''), error }: Props = $props();

	const id = $props.id();
	const PLACEHOLDER = '18:00';
	const CLOSE_PLACEHOLDER = '22:00';
	const describedBy = $derived(error ? `${id}-format ${id}-error` : `${id}-format`);
</script>

<div class="sj-field">
	<div class="times">
		<input
			id="{id}-opens"
			class="sj-input"
			type="text"
			inputmode="numeric"
			autocomplete="off"
			maxlength="5"
			placeholder={PLACEHOLDER}
			dir="ltr"
			aria-label={m.field_opens({ label })}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
			bind:value={opens}
			onblur={() => (opens = normalizeTime(opens))}
		/>
		<span aria-hidden="true">–</span>
		<input
			id="{id}-closes"
			class="sj-input"
			type="text"
			inputmode="numeric"
			autocomplete="off"
			maxlength="5"
			placeholder={CLOSE_PLACEHOLDER}
			dir="ltr"
			aria-label={m.field_closes({ label })}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
			bind:value={closes}
			onblur={() => (closes = normalizeTime(closes))}
		/>
	</div>
	<span class="sj-visually-hidden" id="{id}-format">{m.time_format_hint()}</span>
	{#if error}
		<span class="sj-field-error" id="{id}-error"><Icon name="error" size={20} />{error}</span>
	{/if}
</div>

<style>
	.times {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	.times input {
		flex: 1;
		min-inline-size: 0;
	}
</style>
