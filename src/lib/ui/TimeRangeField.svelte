<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import Icon from './Icon.svelte';

	type Props = { label: string; opens?: string; closes?: string; error?: string };
	let { label, opens = $bindable(''), closes = $bindable(''), error }: Props = $props();

	const id = $props.id();
</script>

<div class="sj-field">
	<div class="times">
		<input
			id="{id}-opens"
			class="sj-input"
			type="time"
			step="60"
			dir="ltr"
			aria-label={m.field_opens({ label })}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error ? `${id}-error` : undefined}
			bind:value={opens}
		/>
		<span aria-hidden="true">–</span>
		<input
			id="{id}-closes"
			class="sj-input"
			type="time"
			step="60"
			dir="ltr"
			aria-label={m.field_closes({ label })}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error ? `${id}-error` : undefined}
			bind:value={closes}
		/>
	</div>
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
