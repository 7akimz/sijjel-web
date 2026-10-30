<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import Icon from './Icon.svelte';

	type Props = {
		label: string;
		value?: string | number | null;
		type?: 'text' | 'email' | 'password' | 'time' | 'number' | 'url' | 'tel';
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
	let revealed = $state(false);
	const shownType = $derived(type === 'password' && revealed ? 'text' : type);
</script>

<div class="sj-field">
	<label class="sj-label" for={id}>{label}</label>
	<div class="control">
		<input
			{id}
			class={['sj-input', type === 'password' && 'secret']}
			type={shownType}
			inputmode={type === 'tel' ? 'tel' : undefined}
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
		{#if type === 'password'}
			<button
				type="button"
				class="reveal"
				aria-label={revealed ? m.action_hide_password() : m.action_show_password()}
				onclick={() => (revealed = !revealed)}
			>
				<Icon name={revealed ? 'visibility_off' : 'visibility'} size={20} />
			</button>
		{/if}
	</div>
	{#if error}
		<span class="sj-field-error" id="{id}-error"><Icon name="error" size={20} />{error}</span>
	{:else if hint}
		<span class="sj-hint" id="{id}-hint">{hint}</span>
	{/if}
</div>

<style>
	.control {
		position: relative;
	}
	.secret {
		padding-inline-end: var(--touch-target);
	}
	.reveal {
		position: absolute;
		inset-block: 0;
		inset-inline-end: 0;
		display: grid;
		place-items: center;
		inline-size: var(--touch-target);
		border: 0;
		border-radius: var(--radius-md);
		background: none;
		color: var(--ink-muted);
		cursor: pointer;
	}
	.reveal:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: -2px;
	}
</style>
