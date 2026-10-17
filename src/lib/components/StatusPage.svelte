<script lang="ts">
	import { EmptyState } from '#lib/ui/index.js';

	type Props = { icon: string; title: string; body: string };
	let { icon, title, body }: Props = $props();
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="sj-page">
	<EmptyState {icon} {title} headingLevel={1}>{body}</EmptyState>
</div>
