<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	type NavItem = { href: string; label: string; icon: string; disabled?: boolean };
	type Props = {
		brand: { name: string; mark: string; href?: string; logo?: string | null };
		nav?: NavItem[];
		current?: string;
		navLabel?: string;
		actions?: Snippet;
		footer?: Snippet;
		children: Snippet;
	};
	let { brand, nav = [], current, navLabel = 'Main', actions, footer, children }: Props = $props();

	const isCurrent = (href: string) =>
		current === href || (href !== '/' && !!current?.startsWith(href + '/'));
</script>

<div class="shell" class:has-bottombar={nav.length > 0}>
	<header class="sj-appbar">
		<a class="brand" href={brand.href ?? '/'}>
			{#if brand.logo}
				<img class="sj-mark sj-mark--logo" src={brand.logo} alt="" />
			{:else}
				<span class="sj-mark" aria-hidden="true">{brand.mark}</span>
			{/if}
			<span class="sj-appbar__name">{brand.name}</span>
		</a>
		<span class="sj-appbar__spacer"></span>
		{#if nav.length > 0}
			<nav class="sj-nav desktop-nav" aria-label={navLabel}>
				{#each nav as item (item.href)}
					{#if item.disabled}
						<span class="sj-nav__item" aria-disabled="true">
							<Icon name={item.icon} size={20} />{item.label}
						</span>
					{:else}
						<a
							class="sj-nav__item"
							href={item.href}
							aria-current={isCurrent(item.href) ? 'page' : undefined}
						>
							<Icon name={item.icon} size={20} />{item.label}
						</a>
					{/if}
				{/each}
			</nav>
		{/if}
		{@render actions?.()}
	</header>

	<main class="content">{@render children()}</main>

	{#if footer}<footer class="footer sj-caption sj-muted">{@render footer()}</footer>{/if}

	{#if nav.length > 0}
		<nav class="sj-bottombar mobile-nav" aria-label={navLabel}>
			{#each nav as item (item.href)}
				{@const active = isCurrent(item.href)}
				{#if item.disabled}
					<span class="sj-bottombar__item" aria-disabled="true">
						<span class="sj-bottombar__pill"><Icon name={item.icon} /></span>
						{item.label}
					</span>
				{:else}
					<a class="sj-bottombar__item" href={item.href} aria-current={active ? 'page' : undefined}>
						<span class="sj-bottombar__pill"><Icon name={item.icon} filled={active} /></span>
						{item.label}
					</a>
				{/if}
			{/each}
		</nav>
	{/if}
</div>

<style>
	.shell {
		min-block-size: 100dvh;
		display: flex;
		flex-direction: column;
	}
	.brand {
		display: inline-flex;
		align-items: center;
		gap: var(--space-3);
		color: inherit;
		text-decoration: none;
		min-inline-size: 0;
	}
	.brand .sj-appbar__name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.content {
		flex: 1;
	}
	.footer {
		padding: var(--space-4);
		text-align: center;
	}
	.mobile-nav {
		position: sticky;
		inset-block-end: 0;
		padding-block-end: env(safe-area-inset-bottom, 0px);
	}
	@media (min-width: 720px) {
		.mobile-nav {
			display: none;
		}
	}
	@media (max-width: 719.98px) {
		.desktop-nav {
			display: none;
		}
	}
</style>
