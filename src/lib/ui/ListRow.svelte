<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		initials: string;
		title: string;
		subtitle?: string;
		highlight?: boolean;
		trailing?: Snippet;
	};
	let { initials, title, subtitle, highlight = false, trailing }: Props = $props();
</script>

<div class={['sj-list__row', highlight && 'sj-list__row--highlight']}>
	<span class="sj-avatar" aria-hidden="true">{initials}</span>
	<div class="sj-list__main">
		<span style="font-weight: 600">{title}</span>
		{#if subtitle}<span class="sj-small sj-muted">{subtitle}</span>{/if}
	</div>
	{@render trailing?.()}
</div>
