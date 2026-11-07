<script lang="ts">
	import type { Snippet } from 'svelte';
	import { reveal } from '../reveal.js';
	import Icon from './Icon.svelte';

	type Props = { tone?: 'success' | 'pending' | 'danger'; icon: string; children: Snippet };
	let { tone = 'success', icon, children }: Props = $props();

	// An error appears at the top of what failed, often far above the button that was pressed.
	const showError = (node: HTMLElement) => {
		reveal(node, 0);
	};
</script>

<div
	class={['sj-banner', tone !== 'success' && `sj-banner--${tone}`]}
	role={tone === 'danger' ? 'alert' : 'status'}
	{@attach tone === 'danger' && showError}
>
	<Icon name={icon} />
	<div>{@render children()}</div>
</div>
