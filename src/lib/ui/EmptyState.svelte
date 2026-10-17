<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	type Props = { icon: string; title: string; children?: Snippet; action?: Snippet };
	let { icon, title, children, action }: Props = $props();
</script>

<div class="sj-empty">
	<div class="sj-empty__well"><Icon name={icon} /></div>
	<h2 class="sj-heading">{title}</h2>
	{#if children}<p class="sj-muted">{@render children()}</p>{/if}
	{@render action?.()}
</div>
