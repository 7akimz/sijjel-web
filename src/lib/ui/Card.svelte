<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = { raised?: boolean; children: Snippet };
	let { raised = false, children }: Props = $props();
</script>

<section class={['sj-card', raised && 'sj-card--raised']}>{@render children()}</section>
