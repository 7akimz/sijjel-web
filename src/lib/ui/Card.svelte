<script lang="ts">
	import type { Snippet } from 'svelte';

	// Active marks the item being edited or confirmed. Raised is for a card that stands alone
	// on an otherwise empty page, such as sign in.
	type Props = { active?: boolean; raised?: boolean; children: Snippet };
	let { active = false, raised = false, children }: Props = $props();
</script>

<section class={['sj-card', active && 'sj-card--active', raised && 'sj-card--raised']}>
	{@render children()}
</section>
