<script lang="ts" module>
	export type MoreMenuItem = { label: string; onselect: () => void; danger?: boolean };
</script>

<script lang="ts">
	import Icon from './Icon.svelte';

	type Props = { label: string; items: MoreMenuItem[] };
	let { label, items }: Props = $props();

	let open = $state(false);
	let root = $state<HTMLElement>();
	let toggle = $state<HTMLButtonElement>();

	function choose(item: MoreMenuItem) {
		open = false;
		item.onselect();
	}

	function close(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !open) return;
		open = false;
		toggle?.focus();
	}

	function outside(event: PointerEvent) {
		if (open && root && !root.contains(event.target as Node)) open = false;
	}
</script>

<svelte:window onkeydown={close} onpointerdown={outside} />

<div class="more" bind:this={root}>
	<button
		bind:this={toggle}
		type="button"
		class="sj-btn sj-btn--quiet sj-btn--icon"
		aria-label={label}
		aria-haspopup="menu"
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		<Icon name="more_vert" size={20} />
	</button>
	{#if open}
		<ul class="menu" role="menu">
			{#each items as item (item.label)}
				<li role="none">
					<button
						type="button"
						role="menuitem"
						class:danger={item.danger}
						onclick={() => choose(item)}>{item.label}</button
					>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.more {
		position: relative;
	}
	.menu {
		position: absolute;
		inset-inline-end: 0;
		top: calc(100% + var(--space-1));
		z-index: 20;
		min-width: 12rem;
		margin: 0;
		padding: var(--space-1);
		list-style: none;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-raised);
	}
	.menu button {
		display: block;
		width: 100%;
		padding: var(--space-2) var(--space-3);
		border: 0;
		border-radius: var(--radius-sm);
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: start;
		cursor: pointer;
	}
	.menu button:hover,
	.menu button:focus-visible {
		background: var(--surface-sunk);
	}
	.menu .danger {
		color: var(--danger);
	}
</style>
