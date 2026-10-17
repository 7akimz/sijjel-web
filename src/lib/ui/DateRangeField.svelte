<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import Icon from './Icon.svelte';

	type Props = { label: string; from?: string; to?: string; error?: string };
	let { label, from = $bindable(''), to = $bindable(''), error }: Props = $props();

	const id = $props.id();

	function onFromInput() {
		if (from && (!to || to < from)) to = from;
	}
</script>

<fieldset class="sj-field">
	<legend class="sj-label">{label}</legend>
	<div class="dates">
		<label class="part">
			<span class="sj-small sj-muted">{m.date_from()}</span>
			<input
				class="sj-input"
				type="date"
				dir="ltr"
				aria-label={m.field_from({ label })}
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={error ? `${id}-error` : undefined}
				bind:value={from}
				oninput={onFromInput}
			/>
		</label>
		<label class="part">
			<span class="sj-small sj-muted">{m.date_to()}</span>
			<input
				class="sj-input"
				type="date"
				dir="ltr"
				min={from || undefined}
				aria-label={m.field_to({ label })}
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={error ? `${id}-error` : undefined}
				bind:value={to}
			/>
		</label>
	</div>
	{#if error}
		<span class="sj-field-error" id="{id}-error"><Icon name="error" size={20} />{error}</span>
	{/if}
</fieldset>

<style>
	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
	}
	.dates {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}
	.part {
		flex: 1 1 10rem;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
</style>
