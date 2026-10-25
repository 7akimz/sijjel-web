<script lang="ts">
	type Props = {
		label: string;
		value?: string;
		options: { value: string; label: string; disabled?: boolean }[];
		error?: string;
		hint?: string;
		name?: string;
	};
	let { label, value = $bindable(''), options, error, hint, name }: Props = $props();
	const id = $props.id();
	const describedBy = $derived(error ? `${id}-error` : hint ? `${id}-hint` : undefined);
</script>

<div class="sj-field">
	<label class="sj-label" for={id}>{label}</label>
	<select
		{id}
		{name}
		class="sj-select"
		bind:value
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={describedBy}
	>
		{#each options as option (option.value)}
			<option value={option.value} disabled={option.disabled}>{option.label}</option>
		{/each}
	</select>
	{#if error}
		<span class="sj-field-error" id="{id}-error">{error}</span>
	{:else if hint}
		<span class="sj-hint" id="{id}-hint">{hint}</span>
	{/if}
</div>
