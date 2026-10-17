<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	type Props = { tone?: 'success' | 'pending' | 'danger'; icon: string; children: Snippet };
	let { tone = 'success', icon, children }: Props = $props();
</script>

<div
	class={['sj-banner', tone !== 'success' && `sj-banner--${tone}`]}
	role={tone === 'danger' ? 'alert' : 'status'}
>
	<Icon name={icon} />
	<div>{@render children()}</div>
</div>
