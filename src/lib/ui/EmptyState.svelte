<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	type Props = {
		icon: string;
		title: string;
		headingLevel?: 1 | 2 | 3;
		children?: Snippet;
		action?: Snippet;
	};
	let { icon, title, headingLevel = 2, children, action }: Props = $props();
</script>

<div class="sj-empty">
	<div class="sj-empty__well"><Icon name={icon} /></div>
	<svelte:element this={`h${headingLevel}`} class="sj-heading">{title}</svelte:element>
	{#if children}<p class="sj-muted">{@render children()}</p>{/if}
	{@render action?.()}
</div>
