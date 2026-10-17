<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		tone?: 'pending' | 'active' | 'stone' | 'danger' | 'level' | 'neutral';
		dot?: boolean;
		children: Snippet;
	};
	let { tone = 'neutral', dot = false, children }: Props = $props();
</script>

<span class={['sj-chip', tone !== 'neutral' && `sj-chip--${tone}`, dot && 'sj-chip--status']}
	>{@render children()}</span
>
