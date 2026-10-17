<script lang="ts">
	import type { Snippet } from 'svelte';
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
	<button class={classes} {type} {disabled} {onclick} aria-label={label}>
		{#if icon}<Icon name={icon} size={20} />{/if}
		{@render children?.()}
	</button>
{/if}
