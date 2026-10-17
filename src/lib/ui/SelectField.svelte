<script lang="ts">
	type Props = {
		label: string;
		value?: string;
		options: { value: string; label: string }[];
		error?: string;
		name?: string;
	};
	let { label, value = $bindable(''), options, error, name }: Props = $props();
	const id = $props.id();
</script>

<div class="sj-field">
	<label class="sj-label" for={id}>{label}</label>
	<select
		{id}
		{name}
		class="sj-select"
		bind:value
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error ? `${id}-error` : undefined}
	>
		{#each options as option (option.value)}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
	{#if error}<span class="sj-field-error" id="{id}-error">{error}</span>{/if}
</div>
