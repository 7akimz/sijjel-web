<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	type Props = {
		variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
		type?: 'button' | 'submit';
		disabled?: boolean;
		block?: boolean;
		icon?: string;
		href?: string;
		label?: string;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
	};
	let {
		variant = 'primary',
		type = 'button',
		disabled = false,
		block = false,
		icon,
		href,
		label,
		onclick,
		children
	}: Props = $props();

	// The server renders submit buttons disabled until the page's script can handle the form, so a
	// tap during loading never falls back to the browser's own submit.
	let hydrated = $state(false);
	onMount(() => (hydrated = true));

	const classes = $derived([
		'sj-btn',
		`sj-btn--${variant}`,
		block && 'sj-btn--block',
		!children && 'sj-btn--icon'
	]);
</script>

{#if href}
	<a class={classes} {href} aria-label={label}>
		{#if icon}<Icon name={icon} size={20} />{/if}
		{@render children?.()}
	</a>
{:else}
	<button
		class={classes}
		{type}
		disabled={disabled || (type === 'submit' && !hydrated)}
		{onclick}
		aria-label={label}
	>
		{#if icon}<Icon name={icon} size={20} />{/if}
		{@render children?.()}
	</button>
{/if}
