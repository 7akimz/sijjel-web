<script lang="ts">
	import Icon from './Icon.svelte';

	type Props = {
		label: string;
		value?: string | number | null;
		type?: 'text' | 'email' | 'password' | 'time' | 'number' | 'url';
		hint?: string;
		error?: string;
		name?: string;
		autocomplete?: HTMLInputElement['autocomplete'];
		required?: boolean;
		readonly?: boolean;
		dir?: 'ltr' | 'rtl' | 'auto';
		placeholder?: string;
	};
	let {
		label,
		value = $bindable(''),
		type = 'text',
		hint,
		error,
		name,
		autocomplete,
		required = false,
		readonly = false,
		dir,
		placeholder
	}: Props = $props();

	const id = $props.id();
	const describedBy = $derived(error ? `${id}-error` : hint ? `${id}-hint` : undefined);
</script>

<div class="sj-field">
	<label class="sj-label" for={id}>{label}</label>
	<input
		{id}
		class="sj-input"
		{type}
		{name}
		{autocomplete}
		{required}
		{readonly}
		{dir}
		{placeholder}
		bind:value
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={describedBy}
	/>
	{#if error}
		<span class="sj-field-error" id="{id}-error"><Icon name="error" size={20} />{error}</span>
	{:else if hint}
		<span class="sj-hint" id="{id}-hint">{hint}</span>
	{/if}
</div>
